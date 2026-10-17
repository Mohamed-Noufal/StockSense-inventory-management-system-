import io
import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

@pytest.mark.asyncio
async def test_list_and_seed_attachments():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/attachments")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)
        assert len(data) >= 2
        first = data[0]
        assert "id" in first
        assert "entity_type" in first
        assert "filename" in first
        assert "download_url" in first

@pytest.mark.asyncio
async def test_filter_attachments_by_entity():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/attachments?entity_type=PURCHASE_ORDER&entity_id=1")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)
        for doc in data:
            assert doc["entity_type"] == "PURCHASE_ORDER"
            assert doc["entity_id"] == 1

@pytest.mark.asyncio
async def test_upload_attachment_multipart():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        fake_file_content = b"%PDF-1.4 Mock Delivery Slip for Drilling Overhaul"
        files = {
            "file": ("Vendor_Delivery_Ticket_999.pdf", io.BytesIO(fake_file_content), "application/pdf")
        }
        data = {
            "entity_type": "MOVEMENT",
            "entity_id": 999,
            "description": "Signed Rig Delivery Waybill Ticket",
            "uploaded_by_name": "Storekeeper Ali",
        }
        res = await ac.post("/api/v1/attachments/upload", files=files, data=data)
        assert res.status_code == 200
        result = res.json()
        assert result["entity_type"] == "MOVEMENT"
        assert result["entity_id"] == 999
        assert result["filename"] == "Vendor_Delivery_Ticket_999.pdf"
        assert result["uploaded_by_name"] == "Storekeeper Ali"
        assert result["file_size_bytes"] == len(fake_file_content)

        # Verify it appears in filtered list
        list_res = await ac.get("/api/v1/attachments?entity_type=MOVEMENT&entity_id=999")
        assert list_res.status_code == 200
        list_data = list_res.json()
        assert any(d["id"] == result["id"] for d in list_data)

        # Verify downloading file
        dl_res = await ac.get(f"/api/v1/attachments/{result['id']}/file")
        assert dl_res.status_code == 200
        assert dl_res.content == fake_file_content

@pytest.mark.asyncio
async def test_invalid_entity_type_rejected():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        files = {
            "file": ("test.pdf", io.BytesIO(b"%PDF-1.4 test"), "application/pdf")
        }
        data = {
            "entity_type": "INVALID_ENTITY",
            "entity_id": 1,
        }
        res = await ac.post("/api/v1/attachments/upload", files=files, data=data)
        assert res.status_code == 400

@pytest.mark.asyncio
async def test_disallowed_extension_rejected():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        files = {
            "file": ("malicious_script.sh", io.BytesIO(b"#!/bin/bash\nrm -rf /"), "application/pdf")
        }
        data = {
            "entity_type": "MOVEMENT",
            "entity_id": 1,
        }
        res = await ac.post("/api/v1/attachments/upload", files=files, data=data)
        assert res.status_code == 400
        assert "extension" in res.json()["detail"].lower()

@pytest.mark.asyncio
async def test_disallowed_mime_type_rejected():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        files = {
            "file": ("test.pdf", io.BytesIO(b"%PDF-1.4 test"), "text/html")
        }
        data = {
            "entity_type": "MOVEMENT",
            "entity_id": 1,
        }
        res = await ac.post("/api/v1/attachments/upload", files=files, data=data)
        assert res.status_code == 400
        assert "content-type" in res.json()["detail"].lower()

@pytest.mark.asyncio
async def test_magic_bytes_mismatch_rejected():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # File claims to be .pdf but has plain text content
        files = {
            "file": ("fake_document.pdf", io.BytesIO(b"Hello world, I am not a real PDF file!"), "application/pdf")
        }
        data = {
            "entity_type": "MOVEMENT",
            "entity_id": 1,
        }
        res = await ac.post("/api/v1/attachments/upload", files=files, data=data)
        assert res.status_code == 400
        assert "signature does not match" in res.json()["detail"].lower()

@pytest.mark.asyncio
async def test_path_traversal_access_denied():
    from backend.app.core.database import SessionLocal
    from backend.app.models.attachments import DocumentAttachment
    from datetime import timezone, datetime

    db = SessionLocal()
    try:
        # Simulate an injected attachment with malicious traversal path
        malicious_doc = DocumentAttachment(
            entity_type="PURCHASE_ORDER",
            entity_id=9999,
            filename="system_passwd.txt",
            file_type="text/plain",
            file_size_bytes=100,
            file_path="/etc/passwd",
            description="Malicious path traversal target",
            uploaded_by_name="Attacker",
            created_at=datetime.now(timezone.utc).isoformat()
        )
        db.add(malicious_doc)
        db.commit()
        db.refresh(malicious_doc)
        doc_id = malicious_doc.id
    finally:
        db.close()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get(f"/api/v1/attachments/{doc_id}/file")
        assert res.status_code == 403
        assert "outside permitted directory" in res.json()["detail"].lower()

