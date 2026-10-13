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
            "file": ("test.txt", io.BytesIO(b"data"), "text/plain")
        }
        data = {
            "entity_type": "INVALID_ENTITY",
            "entity_id": 1,
        }
        res = await ac.post("/api/v1/attachments/upload", files=files, data=data)
        assert res.status_code == 400
