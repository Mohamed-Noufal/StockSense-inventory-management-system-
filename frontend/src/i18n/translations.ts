export type Locale = 'en' | 'ar';

export const translations = {
  en: {
    // Brand & Header
    'brand.name': 'StockSense',
    'brand.tagline': 'AI Inventory Engine',
    'brand.poc': 'POC',
    'brand.full_title': 'AI-Assisted MRO & Oilfield Inventory Intelligence',

    // Navigation
    'nav.overview': 'Overview',
    'nav.inventory': 'Inventory',
    'nav.operations': 'Operations',
    'nav.procurement': 'Procurement',
    'nav.ai': 'AI & Replenishment',
    'nav.activity': 'Activity & Integrity',
    'nav.users': 'Users & Roles',

    // Header Actions
    'header.search_placeholder': 'Search SKU, description, equipment code (Ctrl+K)...',
    'header.scan_sku': 'Scan SKU (F2)',
    'header.new_tx': 'New Transaction',
    'header.switch_employee': 'Switch Employee (Audit Actor)',
    'header.team_directory': 'Open Team Directory & Audit Roles',
    'header.sign_out': 'Sign Out',
    'header.active': 'Active',
    'header.notifications': 'Notifications',
    'header.mark_all_read': 'Mark all as read',
    'header.no_notifications': 'No new alerts or pending tasks.',
    'header.language': 'العربية',

    // Login Portal
    'login.title': 'StockSense',
    'login.subtitle': 'AI-Assisted MRO & Oilfield Inventory Intelligence',
    'login.tab_demo': '1-Click Demo Personas',
    'login.tab_credentials': 'Email & Password',
    'login.persona_storekeeper': 'John Doe',
    'login.persona_storekeeper_role': 'Storekeeper',
    'login.persona_storekeeper_desc': 'Warehouse dock receiving, issue dispatch, scanner mobility',
    'login.persona_procurement': 'Sara Mansour',
    'login.persona_procurement_role': 'Procurement Officer',
    'login.persona_procurement_desc': 'AI replenishment review, PO approval & vendor lead-times',
    'login.persona_manager': 'Khaled Hassan',
    'login.persona_manager_role': 'Operations Manager',
    'login.persona_manager_desc': 'Inventory valuation analytics, audit logs & system governance',
    'login.email_label': 'Email Address',
    'login.password_label': 'Password',
    'login.password_hint': 'Default demo password:',
    'login.signin_btn': 'Sign In with JWT',
    'login.authenticating': 'Authenticating...',
    'login.entering': 'Entering...',
    'login.jwt_badge': 'HS256 Bearer JWT',
    'login.wal_badge': 'SQLite WAL Ledger',
    'login.ai_badge': 'Zero-Leakage AI',

    // Overview KPIs & Widgets
    'overview.total_items': 'Total Items',
    'overview.stock_valuation': 'Total Stock Value',
    'overview.low_stock': 'Low Stock Alerts',
    'overview.open_pos': 'Open Purchase Orders',
    'overview.vs_last_month': 'vs. last month',
    'overview.vs_last_week': 'vs. last week',
    'overview.balance_dist_desc': 'Balance distribution across catalog',
    'overview.items_unit': 'Items',
    'overview.units_avail': 'units available',
    'overview.view_all': 'View all',
    'overview.ai_recs': 'AI Recommendations',
    'overview.recent_act': 'Recent Activity',
    'overview.col_item': 'Item',
    'overview.col_sku': 'SKU',
    'overview.col_current': 'Current Stock',
    'overview.col_reorder': 'Reorder Level',
    'overview.stock_received': 'Stock received',
    'overview.stock_issued': 'Stock issued',
    'overview.transfer': 'Transfer',
    'overview.adjusted': 'Adjusted',
    'overview.reorder_units': 'Reorder {qty} units',
    'overview.requires_reorder': 'requires reorder',
    'overview.awaiting_delivery': 'awaiting delivery',
    'overview.stock_levels_title': 'Stock Levels by Warehouse',
    'overview.stock_levels_desc': 'Grouped units across Main, Field, and Remote sites',
    'overview.quick_operations': 'Quick Operations',
    'overview.action_receipt': 'Receive Goods',
    'overview.action_issue': 'Issue Stock',
    'overview.action_transfer': 'Transfer Stock',
    'overview.action_adjust': 'Adjust Count',
    'overview.recent_activity': 'Recent Operations & Activity',
    'overview.view_all_ledger': 'View Full Ledger',
    'overview.stock_by_category': 'Inventory by Category',
    'overview.ai_proposals': 'AI Replenishment Proposals',
    'overview.review_in_ai': 'Review in AI Hub',
    'overview.critical_attention': 'Items Requiring Critical Attention',
    'overview.on_hand': 'on hand',
    'overview.rop': 'ROP',
    'overview.integrity_cert': '100% Ledger Consistency · Zero Mismatches',
    'overview.synthetic_badge': 'Synthetic Dataset & Proof of Concept',

    // Inventory Workstation
    'inventory.total_items': 'Total Items',
    'inventory.total_value': 'Total Stock Value',
    'inventory.low_stock': 'Low Stock Items',
    'inventory.open_pos': 'Open POs',
    'inventory.vs_last_month': 'vs. last month',
    'inventory.vs_last_week': 'vs. last week',
    'inventory.search_placeholder': 'Search items by name or SKU...',
    'inventory.all_categories': 'All Categories',
    'inventory.all_locations': 'All Locations',
    'inventory.all_status': 'All Stock Status',
    'inventory.in_stock': 'In Stock',
    'inventory.low_stock_pill': 'Low Stock',
    'inventory.out_of_stock': 'Out of Stock',
    'inventory.export': 'Export',
    'inventory.register_item': '+ Register Item',
    'inventory.col_item': 'Item',
    'inventory.col_category': 'Category',
    'inventory.col_warehouse': 'Warehouse',
    'inventory.col_on_hand': 'On Hand',
    'inventory.col_reserved': 'Reserved',
    'inventory.col_available': 'Available',
    'inventory.col_status': 'Status',
    'inventory.col_actions': 'Actions',
    'inventory.quick_issue': 'Quick Issue',
    'inventory.transfer_stock': 'Transfer Stock',
    'inventory.receive_stock': 'Receive Stock',
    'inventory.showing': 'Showing',
    'inventory.of': 'of',
    'inventory.items': 'items',
    'inventory.per_page': '/ page',
    'inventory.tab_overview': 'Overview',
    'inventory.tab_levels': 'Stock Levels',
    'inventory.tab_movements': 'Movements',
    'inventory.tab_details': 'Details',
    'inventory.trend_title': 'Stock Trend (Last 12 Weeks)',
    'inventory.trend_current': 'Current:',
    'inventory.trend_rop': 'ROP:',
    'inventory.recent_movements': 'Recent Movements',
    'inventory.col_date': 'Date',
    'inventory.col_type': 'Type',
    'inventory.col_qty': 'Quantity',
    'inventory.col_ref': 'Reference',
    'inventory.intel_title': 'Operational Intelligence',
    'inventory.reorder_needed': 'Reorder Needed',
    'inventory.healthy_supply': 'Healthy Supply',
    'inventory.stock_runway': 'Est. Stock Runway',
    'inventory.days': 'Days',
    'inventory.burn_rate': 'Burn Rate',
    'inventory.bin_rack': 'Bin & Rack',
    'inventory.total_val': 'Total Value',

    // Operations Workstation
    'operations.title': 'Operations',
    'operations.scan_barcode': 'Scan Barcode',
    'operations.current_sprint': 'Current Sprint (Oct 1 – Oct 15, 2026)',
    'operations.last_7_days': 'Last 7 Days',
    'operations.last_14_days': 'Last 14 Days',
    'operations.last_30_days': 'Last 30 Days',
    'operations.all_operations': 'All Operations (Full Ledger)',
    'operations.card_issue_title': 'Issue Stock',
    'operations.card_issue_desc': 'Remove items from inventory for projects or internal use.',
    'operations.card_issue_btn': 'New Issue',
    'operations.card_transfer_title': 'Transfer Stock',
    'operations.card_transfer_desc': 'Move items between warehouses or locations.',
    'operations.card_transfer_btn': 'New Transfer',
    'operations.card_receive_title': 'Receive Stock',
    'operations.card_receive_desc': 'Record incoming deliveries from suppliers.',
    'operations.card_receive_btn': 'New Receipt',
    'operations.card_adjust_title': 'Adjust Stock Count',
    'operations.card_adjust_desc': 'Fix discrepancies from cycle counts or physical checks.',
    'operations.card_adjust_btn': 'New Adjustment',
    'operations.stats_title': 'Operation Stats',
    'operations.stat_issues': 'Issues',
    'operations.stat_transfers': 'Transfers',
    'operations.stat_receipts': 'Receipts',
    'operations.stat_adjustments': 'Adjustments',
    'operations.recent_ops_title': 'Recent Operations',
    'operations.view_all': 'View all',
    'operations.tab_all': 'All',
    'operations.tab_issues': 'Issues',
    'operations.tab_transfers': 'Transfers',
    'operations.tab_receipts': 'Receipts',
    'operations.tab_adjustments': 'Adjustments',
    'operations.col_date_time': 'Date & Time',
    'operations.col_type': 'Type',
    'operations.col_item': 'Item',
    'operations.col_sku': 'SKU',
    'operations.col_quantity': 'Quantity',
    'operations.col_from_to': 'From → To',
    'operations.col_reference': 'Reference',
    'operations.col_status': 'Status',
    'operations.col_actions': 'Actions',
    'operations.empty_filter': 'No operations match the selected filter.',
    'operations.recent_activity': 'Recent Activity',
    'operations.status_completed': 'Completed',
    'operations.audit_details': 'Audit Details',
    'operations.copy_ref': 'Copy Reference',
    'operations.print_waybill': 'Print Waybill',
    'operations.showing': 'Showing',
    'operations.of': 'of',
    'operations.operations_count': 'operations',
    'operations.no_recent_activity': 'No recent activity recorded.',

    // Procurement Workstation
    'procurement.title': 'Purchase Orders',
    'procurement.subtitle': 'Track supplier orders, manage approvals, and record incoming deliveries.',
    'procurement.export_csv': 'Export CSV',
    'procurement.create_po': '+ Create Purchase Order',
    'procurement.open_orders': 'Open Purchase Orders',
    'procurement.open_orders_sub': 'Draft, Approved & Partially Received',
    'procurement.awaiting_approval': 'Awaiting Approval',
    'procurement.awaiting_approval_sub': 'Draft orders pending authorization',
    'procurement.partially_received': 'Partially Received',
    'procurement.partially_received_sub': 'Deliveries in progress on dock',
    'procurement.overdue_deliveries': 'Overdue Deliveries',
    'procurement.overdue_sub': 'Arrival date passed & order open',
    'procurement.search_placeholder': 'Search by PO number or supplier...',
    'procurement.all_statuses': 'All Statuses',
    'procurement.all_suppliers': 'All Suppliers',
    'procurement.col_po_number': 'PO Number',
    'procurement.col_supplier': 'Supplier Partner',
    'procurement.col_created': 'Order Date',
    'procurement.col_expected': 'Expected Delivery',
    'procurement.col_items': 'Items',
    'procurement.col_total': 'Total Value',
    'procurement.col_destination': 'Destination',
    'procurement.col_source': 'Source',
    'procurement.col_status': 'Status',
    'procurement.col_actions': 'Actions',
    'procurement.btn_approve': 'Approve',
    'procurement.btn_receive': 'Receive',
    'procurement.btn_view': 'View Details',
    'procurement.btn_clear': 'Clear',
    'procurement.empty_msg': 'No purchase orders found matching this filter criteria.',
    'procurement.loading_msg': 'Loading purchase orders from inventory ledger...',

    // AI Replenishment
    'ai.title': 'AI Replenishment Intelligence',
    'ai.subtitle': 'Autonomous demand pattern classification, Croston/SBA/TSB models & policy replenishment engine',
    'ai.run_btn': 'Run Forecast & Analysis',
    'ai.analyzing': 'Analyzing Ledger...',
    'ai.engine_active': 'TSB ENGINE ACTIVE',
    'ai.running_pipeline': 'RUNNING PIPELINE',
    'ai.open_recs': 'Open Recommendations',
    'ai.critical_risks': 'Critical Replenishment Risks',
    'ai.critical_risks_sub': 'Stockout imminent within current lead time',
    'ai.below_rop': 'Items Below Reorder Point',
    'ai.below_rop_sub': 'Inventory position < safety stock + demand',
    'ai.low_conf': 'Low-Confidence Forecasts',
    'ai.low_conf_sub': 'Confidence < 60% due to erratic zero counts',
    'ai.tab_recs': 'Recommendations',
    'ai.tab_forecasts': 'Forecasts & Observed Demand',
    'ai.tab_report': 'AI Model Backtest Report',
    'ai.search_placeholder': 'Filter by SKU, spare name, or location...',
    'ai.urgency_label': 'Urgency:',
    'ai.status_label': 'Status:',
    'ai.col_urgency': 'Urgency',
    'ai.col_item': 'Spare Item & SKU',
    'ai.col_pattern': 'Demand Pattern',
    'ai.col_stock_vs_rop': 'Stock Position vs ROP',
    'ai.col_suggested': 'Suggested Order',
    'ai.col_confidence': 'Confidence',
    'ai.col_status': 'Status',
    'ai.col_actions': 'Actions',
    'ai.btn_explain': 'Explain',
    'ai.btn_approve': 'Approve',
    'ai.btn_dismiss': 'Dismiss',
    'ai.empty_filter': 'No recommendations match the active filter criteria.',
    'ai.empty_filter_sub': 'Try clearing filters or click "Run Forecast & Analysis" to evaluate live inventory positions.',

    // Activity & Integrity
    'activity.title': 'Activity & Integrity Center',
    'activity.subtitle': 'Immutable append-only audit ledger, operational exception alerts & real-time mathematical balance verification',
    'activity.export_csv': 'Export CSV',
    'activity.total_events': 'Total Ledger Events',
    'activity.total_events_sub': 'Append-only physical transactions',
    'activity.system_exceptions': 'Active System Exceptions',
    'activity.exceptions_sub': 'Pending operational review',
    'activity.critical_alerts': 'Critical Risk Alerts',
    'activity.critical_alerts_sub': 'Stockout hazards & safety breaches',
    'activity.ledger_consistency': 'Ledger Consistency',
    'activity.consistency_sub': 'Zero mathematical balance drift',
    'activity.tab_ledger': 'Stock Ledger',
    'activity.tab_alerts': 'Alerts & Exceptions',
    'activity.tab_integrity': 'Integrity Diagnostic',
    'activity.search_placeholder': 'Filter by SKU, name, reference, actor, or ID...',
    'activity.delta_label': 'Delta:',
    'activity.delta_all': 'All',
    'activity.delta_in': '+ In',
    'activity.delta_out': '- Out',
    'activity.all_types': 'All Movement Types',
    'activity.type_receipts': 'Receipts',
    'activity.type_issues': 'Issues',
    'activity.type_transfers': 'Transfers (In/Out)',
    'activity.type_adjustments': 'Adjustments',
    'activity.all_locations': 'All Facility Locations',
    'activity.time_24h': 'Last 24 Hours',
    'activity.time_7d': 'Last 7 Days',
    'activity.time_30d': 'Last 30 Days',
    'activity.time_90d': 'Last 90 Days',
    'activity.time_all': 'All Time History',
    'activity.col_event_id': 'Event ID',
    'activity.col_type': 'Type',
    'activity.col_delta': 'Signed Delta',
    'activity.col_item': 'Spare Item & SKU',
    'activity.col_route': 'Location Route',
    'activity.col_ref': 'Reference / Doc',
    'activity.col_actor': 'Actor Attribution',
    'activity.col_time': 'Occurred At',
    'activity.col_details': 'Details',
    'activity.empty_filter': 'No ledger transactions match the active filter criteria.',

    // Sidebar & Header extras
    'sidebar.mgmt_health': 'Management & Health',
    'sidebar.promo_title': 'Keep your stock running smoothly',
    'sidebar.promo_desc': 'AI-powered insights for better decisions.',
    'sidebar.engine_db': 'Engine: SQLite WAL',
    'sidebar.api_online': 'API: Online (Port 8000)',
    'sidebar.api_connecting': 'Connecting...',
    'header.alerts_title': 'Operational Alerts',
    'header.alerts_new': 'New',

    // Users Workstation
    'users.title': 'Active Personnel',
    'users.subtitle': 'Authenticated personnel in SQLite database',
    'users.storekeepers': 'Storekeepers (Yard & Base)',
    'users.storekeepers_sub': 'Custodians authorized for receipts & issues',
    'users.procurement': 'Procurement Officers',
    'users.procurement_sub': 'Requisition approvers',
    'users.active_shift': 'Active Operating Shift',
    'users.directory_title': 'Employee Directory & Operational Roles',
    'users.directory_desc': 'Real database identities linked to every ledger movement, transfer, and procurement decision.',
    'users.audit_active': 'Audit Trail Non-Repudiation Active',
    'users.col_employee': 'Employee',
    'users.col_role': 'Assigned Role',
    'users.col_email': 'Work Email',
    'users.col_status': 'Status',
    'users.col_movements': 'Audit Movements Logged',
    'users.col_created': 'Account Created',
    'users.col_session': 'Active Session',
    'users.active': 'Active',
    'users.inactive': 'Inactive',
    'users.logged_in': '✓ Logged In',
    'users.switch_to_user': 'Switch to User',
    'users.ledger_btn': 'Ledger',

    // Movement Modal
    'movement_modal.title_receipt': 'Record Receipt Transaction',
    'movement_modal.title_issue': 'Record Issue Transaction',
    'movement_modal.title_transfer': 'Record Transfer Transaction',
    'movement_modal.title_adjust': 'Record Adjustment Transaction',
    'movement_modal.server_rejected': 'Transaction Rejected by Server',
    'movement_modal.tx_mode': 'Transaction Mode',
    'movement_modal.mode_receipt': 'Receive',
    'movement_modal.mode_issue': 'Issue',
    'movement_modal.mode_transfer': 'Transfer',
    'movement_modal.mode_adjust': 'Adjust',
    'movement_modal.item_label': 'Item / Spare Part SKU',
    'movement_modal.source_wh': 'Source Warehouse (From)',
    'movement_modal.wh_loc': 'Warehouse Location',
    'movement_modal.dest_wh': 'Destination Warehouse (To)',
    'movement_modal.issue_dest': 'Issue Destination (Project / Rig / Workshop)',
    'movement_modal.adj_type': 'Adjustment Type',
    'movement_modal.surplus': 'Surplus (+) [Found Stock]',
    'movement_modal.shrinkage': 'Shrinkage (-) [Damaged / Missing]',
    'movement_modal.qty_units': 'Quantity Units',
    'movement_modal.avail_at': 'Available at',
    'movement_modal.set_max': 'Set Max',
    'movement_modal.ref_receipt': 'Purchase Order or Delivery Reference',
    'movement_modal.ref_issue': 'Requisition Reference / Work Order',
    'movement_modal.ref_transfer': 'Transfer Waybill Reference',
    'movement_modal.ref_adjust': 'Cycle Count Sheet / Audit Reference',
    'movement_modal.doc_proof': 'Physical Document Proof (PDF / Images)',
    'movement_modal.optional_audit': 'Optional • Audit Verification',
    'movement_modal.dropzone_text': 'Click or drop physical delivery docket, bill of lading, or inspection photo',
    'movement_modal.dropzone_hint': 'Supports PDF, PNG, JPG up to 15MB',
    'movement_modal.commit_btn': 'Commit to Ledger',
    'movement_modal.recording_btn': 'Recording Movement...',
    'movement_modal.zero_stock': 'Zero Stock at Location',
    'movement_modal.exceeds_avail': 'Exceeds Available',

    // Barcode Scanner Modal
    'scanner.title': 'Scan Barcode & SKU Lookup (F2)',
    'scanner.mode_gun': 'USB Laser Gun',
    'scanner.mode_camera': 'Camera Optical Lens',
    'scanner.search_placeholder': 'Scan barcode with USB gun, enter SKU, Vendor Part #, or PO #...',
    'scanner.presets_title': 'Interview Demonstration Presets (Click to Simulate Hardware Scan):',
    'scanner.inbound_docket': 'Inbound Delivery Docket',
    'scanner.supplier': 'Supplier:',
    'scanner.expected': 'Expected:',
    'scanner.destination': 'Destination:',
    'scanner.delivery_lines': 'Delivery Lines & Ordered Quantities:',
    'scanner.receive_btn': 'Receive Goods Inbound',
    'scanner.receiving_btn': 'Receiving...',
    'scanner.btn_issue': 'Issue Stock',
    'scanner.btn_receive': 'Receive Goods',
    'scanner.btn_print_tag': 'Print Bin Tag',
    'scanner.btn_inspect': 'Inspect Item',
    'scanner.btn_register_new': 'Register as New Item',

    // New Item Modal
    'new_item.title': 'Register New Catalog Item',
    'new_item.sku': 'Item SKU / Part Number',
    'new_item.name': 'Part / Equipment Name',
    'new_item.category': 'Category',
    'new_item.uom': 'Unit of Measure (UOM)',
    'new_item.unit_cost': 'Unit Cost (USD)',
    'new_item.criticality': 'Operational Criticality',
    'new_item.initial_loc': 'Initial Warehouse Location',
    'new_item.initial_stock': 'Initial Stock Count',
    'new_item.supplier': 'Supplier Partner',
    'new_item.vendor_sku': 'Vendor Part Number / Catalog #',
    'new_item.submit_btn': 'Register Item into Catalog',
    'new_item.saving_btn': 'Registering SKU...',
    'new_item.print_label': 'Print Storage Label',

    // Common
    'common.warehouse': 'Warehouse',
    'common.status': 'Status',
    'common.sku': 'SKU',
    'common.quantity': 'Quantity',
    'common.units': 'units',
    'common.cancel': 'Cancel',
    'common.submit': 'Submit',
    'common.confirm': 'Confirm',
    'common.close': 'Close',
  },
  ar: {
    // Brand & Header
    'brand.name': 'ستوك سينس',
    'brand.tagline': 'محرك الذكاء الاصطناعي للمخزون',
    'brand.poc': 'تجريبي',
    'brand.full_title': 'منظومة ذكاء إدارة مخزون حقول النفط وقطع الغيار (MRO)',

    // Navigation
    'nav.overview': 'نظرة عامة',
    'nav.inventory': 'المستودع والمخزون',
    'nav.operations': 'حركات المخزون والعمليات',
    'nav.procurement': 'أوامر الشراء والتوريد',
    'nav.ai': 'ذكاء التنبؤ وإعادة الطلب',
    'nav.activity': 'التدقيق ومطابقة السجل',
    'nav.users': 'فريق العمل والأدوار',

    // Header Actions
    'header.search_placeholder': 'بحث برمز الصنف، الوصف، كود المعدة (Ctrl+K)...',
    'header.scan_sku': 'مسح باركود (F2)',
    'header.new_tx': 'حركة جديدة',
    'header.switch_employee': 'تبديل الموظف (المسؤول بالتدقيق)',
    'header.team_directory': 'فتح دليل الفريق وصلاحيات التدقيق',
    'header.sign_out': 'تسجيل الخروج',
    'header.active': 'نشط',
    'header.notifications': 'الإشعارات والتنبيهات',
    'header.mark_all_read': 'تعيين الكل كمقروء',
    'header.no_notifications': 'لا توجد تنبيهات جديدة أو مهام معلقة.',
    'header.language': 'English',

    // Login Portal
    'login.title': 'ستوك سينس',
    'login.subtitle': 'منظومة ذكاء إدارة مخزون حقول النفط وقطع الغيار (MRO)',
    'login.tab_demo': 'دخول تجريبي بضغطة واحدة',
    'login.tab_credentials': 'البريد الإلكتروني وكلمة المرور',
    'login.persona_storekeeper': 'أحمد فوزي',
    'login.persona_storekeeper_role': 'أمين المستودع',
    'login.persona_storekeeper_desc': 'استلام الرصيف المستودعي، صرف المواد، المسح الضوئي',
    'login.persona_procurement': 'سارة منصور',
    'login.persona_procurement_role': 'مسؤول المشتريات',
    'login.persona_procurement_desc': 'مراجعة توصيات الذكاء الاصطناعي، اعتماد أوامر الشراء، مدد التوريد',
    'login.persona_manager': 'خالد حسن',
    'login.persona_manager_role': 'مدير العمليات',
    'login.persona_manager_desc': 'تحليلات تقييم المخزون، سجل التدقيق والحوكمة الرقابية',
    'login.email_label': 'البريد الإلكتروني',
    'login.password_label': 'كلمة المرور',
    'login.password_hint': 'كلمة المرور الافتراضية للتجربة:',
    'login.signin_btn': 'تسجيل الدخول الآمن (JWT)',
    'login.authenticating': 'جاري التحقق والمصادقة...',
    'login.entering': 'جاري الدخول...',
    'login.jwt_badge': 'توثيق مشفّر HS256 JWT',
    'login.wal_badge': 'سجل مالي SQLite WAL',
    'login.ai_badge': 'ذكاء تنبؤي فوري',

    // Overview KPIs & Widgets
    'overview.total_items': 'إجمالي الأصناف',
    'overview.stock_valuation': 'إجمالي قيمة المخزون',
    'overview.low_stock': 'تنبيهات انخفاض الرصيد',
    'overview.open_pos': 'أوامر الشراء المفتوحة',
    'overview.vs_last_month': 'مقارنة بالشهر السابق',
    'overview.vs_last_week': 'مقارنة بالأسبوع السابق',
    'overview.balance_dist_desc': 'توزيع الأرصدة عبر دليل الأصناف',
    'overview.items_unit': 'صنفاً',
    'overview.units_avail': 'وحدة متاحة',
    'overview.view_all': 'عرض الكل',
    'overview.ai_recs': 'توصيات الذكاء الاصطناعي',
    'overview.recent_act': 'أحدث الأنشطة',
    'overview.col_item': 'الصنف',
    'overview.col_sku': 'رمز الصنف',
    'overview.col_current': 'الرصيد الحالي',
    'overview.col_reorder': 'حد الطلب',
    'overview.stock_received': 'تم استلام مخزون',
    'overview.stock_issued': 'تم صرف مخزون',
    'overview.transfer': 'تحويل مخزون',
    'overview.adjusted': 'تسوية مخزون',
    'overview.reorder_units': 'إعادة طلب {qty} وحدة',
    'overview.requires_reorder': 'تتطلب إعادة طلب',
    'overview.awaiting_delivery': 'بانتظار التوريد',
    'overview.stock_levels_title': 'مستويات المخزون حسب الموقع والمستودع',
    'overview.stock_levels_desc': 'مقارنة الكميات بين المستودع المركزي، الحقل، والمواقع البعيدة',
    'overview.quick_operations': 'عمليات وحركات سريعة',
    'overview.action_receipt': 'استلام بضاعة',
    'overview.action_issue': 'صرف مواد',
    'overview.action_transfer': 'تحويل داخلي',
    'overview.action_adjust': 'تسوية جردية',
    'overview.recent_activity': 'أحدث العمليات وسجل الحركات',
    'overview.view_all_ledger': 'عرض سجل الحركات بالكامل',
    'overview.stock_by_category': 'توزيع المخزون حسب التصنيف',
    'overview.ai_proposals': 'مقترحات إعادة الطلب الذكية',
    'overview.review_in_ai': 'مراجعة في مركز الذكاء',
    'overview.critical_attention': 'أصناف حرجة تتطلب تدخلاً عاجلاً',
    'overview.on_hand': 'متوفر',
    'overview.rop': 'حد الطلب',
    'overview.integrity_cert': 'مطابقة تامة للسجل 100% · لا توجد فروقات',
    'overview.synthetic_badge': 'بيانات اصطناعية لأغراض العرض والتقييم',

    // Inventory Workstation
    'inventory.total_items': 'إجمالي الأصناف',
    'inventory.total_value': 'إجمالي قيمة المخزون',
    'inventory.low_stock': 'تنبيهات انخفاض الرصيد',
    'inventory.open_pos': 'أوامر الشراء المفتوحة',
    'inventory.vs_last_month': 'مقارنة بالشهر السابق',
    'inventory.vs_last_week': 'مقارنة بالأسبوع السابق',
    'inventory.search_placeholder': 'بحث برمز الصنف، الاسم، أو التصنيف...',
    'inventory.all_categories': 'جميع التصنيفات',
    'inventory.all_locations': 'جميع المواقع',
    'inventory.all_status': 'جميع حالات المخزون',
    'inventory.in_stock': 'متوفر بالمستودع',
    'inventory.low_stock_pill': 'رصيد منخفض',
    'inventory.out_of_stock': 'نفد من المخزون',
    'inventory.export': 'تصدير',
    'inventory.register_item': '+ إضافة صنف جديد',
    'inventory.col_item': 'الصنف',
    'inventory.col_category': 'التصنيف',
    'inventory.col_warehouse': 'المستودع',
    'inventory.col_on_hand': 'الرصيد الفعلي',
    'inventory.col_reserved': 'المحجوز',
    'inventory.col_available': 'المتاح للصرف',
    'inventory.col_status': 'الحالة',
    'inventory.col_actions': 'إجراءات',
    'inventory.quick_issue': 'صرف سريع',
    'inventory.transfer_stock': 'تحويل مخزون',
    'inventory.receive_stock': 'استلام مخزون',
    'inventory.showing': 'عرض',
    'inventory.of': 'من إجمالي',
    'inventory.items': 'صنفاً',
    'inventory.per_page': '/ صفحة',
    'inventory.tab_overview': 'نظرة عامة',
    'inventory.tab_levels': 'مستويات المخزون',
    'inventory.tab_movements': 'سجل الحركات',
    'inventory.tab_details': 'التفاصيل والمواصفات',
    'inventory.trend_title': 'مسار حركة المخزون (آخر 12 أسبوعاً)',
    'inventory.trend_current': 'الحالي:',
    'inventory.trend_rop': 'حد الطلب:',
    'inventory.recent_movements': 'أحدث الحركات',
    'inventory.col_date': 'التاريخ',
    'inventory.col_type': 'النوع',
    'inventory.col_qty': 'الكمية',
    'inventory.col_ref': 'المرجع',
    'inventory.intel_title': 'الذكاء التشغيلي',
    'inventory.reorder_needed': 'يلزم إعادة الطلب',
    'inventory.healthy_supply': 'إمداد مستقر ومثالي',
    'inventory.stock_runway': 'المدة التقديرية للرصيد',
    'inventory.days': 'يوم',
    'inventory.burn_rate': 'معدل الاستهلاك',
    'inventory.bin_rack': 'موقع الرف والقاطع',
    'inventory.total_val': 'إجمالي القيمة',

    // Operations Workstation
    'operations.title': 'حركات المخزون والعمليات',
    'operations.scan_barcode': 'مسح باركود (F2)',
    'operations.current_sprint': 'دورة العمل الحالية (1 - 15 أكتوبر 2026)',
    'operations.last_7_days': 'آخر 7 أيام',
    'operations.last_14_days': 'آخر 14 يوماً',
    'operations.last_30_days': 'آخر 30 يوماً',
    'operations.all_operations': 'جميع العمليات (السجل بالكامل)',
    'operations.card_issue_title': 'صرف مواد للمشاريع',
    'operations.card_issue_desc': 'إخراج المواد وقطع الغيار لصالح المشاريع أو الاستخدام الداخلي.',
    'operations.card_issue_btn': 'صرف جديد',
    'operations.card_transfer_title': 'تحويل مخزون داخلي',
    'operations.card_transfer_desc': 'نقل المواد والمهمات بين المستودعات والمواقع الميدانية.',
    'operations.card_transfer_btn': 'تحويل جديد',
    'operations.card_receive_title': 'استلام بضاعة ومواد',
    'operations.card_receive_desc': 'تسجيل وتدقيق التوريدات والشحنات الواردة من الموردين.',
    'operations.card_receive_btn': 'استلام جديد',
    'operations.card_adjust_title': 'تسوية جردية',
    'operations.card_adjust_desc': 'معالجة الفروقات الناتجة عن الجرد الدوري والمطابقة الفعلية.',
    'operations.card_adjust_btn': 'تسوية جديدة',
    'operations.stats_title': 'إحصائيات العمليات',
    'operations.stat_issues': 'أوامر الصرف',
    'operations.stat_transfers': 'التحويلات',
    'operations.stat_receipts': 'سندات الاستلام',
    'operations.stat_adjustments': 'التسويات الجردية',
    'operations.recent_ops_title': 'أحدث العمليات والحركات',
    'operations.view_all': 'عرض الكل',
    'operations.tab_all': 'الكل',
    'operations.tab_issues': 'صرف',
    'operations.tab_transfers': 'تحويلات',
    'operations.tab_receipts': 'استلام',
    'operations.tab_adjustments': 'تسويات',
    'operations.col_date_time': 'التاريخ والوقت',
    'operations.col_type': 'النوع',
    'operations.col_item': 'الصنف',
    'operations.col_sku': 'رمز الصنف',
    'operations.col_quantity': 'الكمية',
    'operations.col_from_to': 'من ← إلى',
    'operations.col_reference': 'المرجع',
    'operations.col_status': 'الحالة',
    'operations.col_actions': 'إجراءات',
    'operations.empty_filter': 'لا توجد عمليات تطابق التصفية المحددة.',
    'operations.recent_activity': 'أحدث الأنشطة',
    'operations.status_completed': 'مكتمل',
    'operations.audit_details': 'تفاصيل التدقيق',
    'operations.copy_ref': 'نسخ المرجع',
    'operations.print_waybill': 'طباعة بوليصة الشحن',
    'operations.showing': 'عرض',
    'operations.of': 'من إجمالي',
    'operations.operations_count': 'عملية',
    'operations.no_recent_activity': 'لا توجد أنشطة مسجلة مؤخراً.',

    // Procurement Workstation
    'procurement.title': 'أوامر الشراء والتوريد',
    'procurement.subtitle': 'متابعة أوامر الموردين، إدارة الموافقات، واعتماد الاستلام الرصيفي.',
    'procurement.export_csv': 'تصدير CSV',
    'procurement.create_po': '+ إنشاء أمر شراء',
    'procurement.open_orders': 'أوامر الشراء المفتوحة',
    'procurement.open_orders_sub': 'مسودات، معتمدة، ومستلمة جزئياً',
    'procurement.awaiting_approval': 'بانتظار الاعتماد',
    'procurement.awaiting_approval_sub': 'أوامر مسودة قيد المصادقة',
    'procurement.partially_received': 'مستلمة جزئياً',
    'procurement.partially_received_sub': 'شحنات قيد التوريد على الرصيف',
    'procurement.overdue_deliveries': 'توريدات متأخرة',
    'procurement.overdue_sub': 'تجاوزت تاريخ التسليم المتوقع والأمر ما زال مفتوحاً',
    'procurement.search_placeholder': 'بحث برقم أمر الشراء أو المورد...',
    'procurement.all_statuses': 'جميع الحالات',
    'procurement.all_suppliers': 'جميع الموردين',
    'procurement.col_po_number': 'رقم أمر الشراء',
    'procurement.col_supplier': 'المورد الشريك',
    'procurement.col_created': 'تاريخ الطلب',
    'procurement.col_expected': 'التوريد المتوقع',
    'procurement.col_items': 'البنود',
    'procurement.col_total': 'إجمالي القيمة',
    'procurement.col_destination': 'وجهة التسليم',
    'procurement.col_source': 'المصدر',
    'procurement.col_status': 'الحالة',
    'procurement.col_actions': 'إجراءات',
    'procurement.btn_approve': 'اعتماد',
    'procurement.btn_receive': 'استلام',
    'procurement.btn_view': 'عرض التفاصيل',
    'procurement.btn_clear': 'مسح التصفية',
    'procurement.empty_msg': 'لا توجد أوامر شراء تطابق معايير البحث المحددة.',
    'procurement.loading_msg': 'جاري تحميل أوامر الشراء من سجل المستودع...',

    // AI Replenishment
    'ai.title': 'ذكاء إعادة الطلب والتنبؤ',
    'ai.subtitle': 'تصنيف أنماط الطلب ذاتياً، نماذج Croston/SBA/TSB، ومحرك سياسات تجديد المخزون',
    'ai.run_btn': 'تشغيل التحليل والتنبؤ الذكي',
    'ai.analyzing': 'جاري تحليل السجل...',
    'ai.engine_active': 'محرك TSB نشط',
    'ai.running_pipeline': 'جاري تشغيل خط التحليل',
    'ai.open_recs': 'توصيات إعادة الطلب المفتوحة',
    'ai.critical_risks': 'مخاطر نفاد المخزون الحرجة',
    'ai.critical_risks_sub': 'خطر النفاد وشيك خلال مدة التوريد الحالية',
    'ai.below_rop': 'أصناف تحت حد الطلب',
    'ai.below_rop_sub': 'الرصيد أقل من مخزون الأمان + الطلب',
    'ai.low_conf': 'توقعات منخفضة الثقة',
    'ai.low_conf_sub': 'الثقة أقل من 60% بسبب تكرار فترات انعدام الطلب',
    'ai.tab_recs': 'التوصيات المقترحة',
    'ai.tab_forecasts': 'التنبؤات والطلب المرصود',
    'ai.tab_report': 'تقرير فحص واختبار النموذج',
    'ai.search_placeholder': 'تصفية برمز الصنف، الاسم، أو الموقع...',
    'ai.urgency_label': 'درجة الأهمية:',
    'ai.status_label': 'الحالة:',
    'ai.col_urgency': 'الأهمية',
    'ai.col_item': 'الصنف ورمز التخزين',
    'ai.col_pattern': 'نمط الطلب',
    'ai.col_stock_vs_rop': 'الرصيد مقابل حد الطلب',
    'ai.col_suggested': 'الطلب المقترح',
    'ai.col_confidence': 'نسبة الثقة',
    'ai.col_status': 'الحالة',
    'ai.col_actions': 'إجراءات',
    'ai.btn_explain': 'تفسير التحليل',
    'ai.btn_approve': 'اعتماد',
    'ai.btn_dismiss': 'تجاهل',
    'ai.empty_filter': 'لا توجد توصيات تطابق معايير التصفية المحددة.',
    'ai.empty_filter_sub': 'حاول مسح التصفية أو اضغط على "تشغيل التحليل والتنبؤ الذكي" لتقييم أرصدة المخزون الحالية.',

    // Activity & Integrity
    'activity.title': 'مركز التدقيق وسلامة السجل',
    'activity.subtitle': 'سجل حركات غير قابل للتعديل، استثناءات العمليات، ومطابقة رياضية فورية للأرصدة',
    'activity.export_csv': 'تصدير CSV',
    'activity.total_events': 'إجمالي حركات السجل',
    'activity.total_events_sub': 'حركات فعلية مسجلة بالتسلسل الزمني',
    'activity.system_exceptions': 'استثناءات النظام النشطة',
    'activity.exceptions_sub': 'قيد المراجعة والتدقيق التشغيلي',
    'activity.critical_alerts': 'تنبيهات المخاطر الحرجة',
    'activity.critical_alerts_sub': 'مخاطر نفاد المخزون وتجاوز معايير الأمان',
    'activity.ledger_consistency': 'مطابقة السجل المحاسبي',
    'activity.consistency_sub': 'انعدام تام للفروقات الرياضية في الرصيد',
    'activity.tab_ledger': 'سجل الحركات',
    'activity.tab_alerts': 'تنبيهات الاستثناءات',
    'activity.tab_integrity': 'الفحص التشخيصي للتطابق',
    'activity.search_placeholder': 'تصفية برمز الصنف، الاسم، المرجع، الموظف، أو المعرف...',
    'activity.delta_label': 'صافي الحركة:',
    'activity.delta_all': 'الكل',
    'activity.delta_in': '+ وارد',
    'activity.delta_out': '- صادر',
    'activity.all_types': 'جميع أنواع الحركات',
    'activity.type_receipts': 'سندات استلام',
    'activity.type_issues': 'أذونات صرف',
    'activity.type_transfers': 'تحويلات (صادر/وارد)',
    'activity.type_adjustments': 'تسويات جردية',
    'activity.all_locations': 'جميع مواقع المنشأة',
    'activity.time_24h': 'آخر 24 ساعة',
    'activity.time_7d': 'آخر 7 أيام',
    'activity.time_30d': 'آخر 30 يوماً',
    'activity.time_90d': 'آخر 90 يوماً',
    'activity.time_all': 'كامل السجل التاريخي',
    'activity.col_event_id': 'معرف الحركة',
    'activity.col_type': 'النوع',
    'activity.col_delta': 'صافي التغير',
    'activity.col_item': 'الصنف ورمز التخزين',
    'activity.col_route': 'مسار الموقع',
    'activity.col_ref': 'المرجع / المستند',
    'activity.col_actor': 'المسؤول التنفيذي',
    'activity.col_time': 'تاريخ ووقت الحركة',
    'activity.col_details': 'التفاصيل',
    'activity.empty_filter': 'لا توجد حركات في السجل تطابق معايير التصفية المحددة.',

    // Sidebar & Header extras
    'sidebar.mgmt_health': 'الإدارة وفحص النظام',
    'sidebar.promo_title': 'حافظ على استقرار عمليات المستودع',
    'sidebar.promo_desc': 'تحليلات ذكية لاتخاذ قرارات تشغيلية دقيقة.',
    'sidebar.engine_db': 'المحرك: SQLite WAL',
    'sidebar.api_online': 'الواجهة البرمجية: نشطة (منفذ 8000)',
    'sidebar.api_connecting': 'جاري الاتصال...',
    'header.alerts_title': 'تنبيهات العمليات',
    'header.alerts_new': 'جديد',

    // Users Workstation
    'users.title': 'إجمالي الموظفين النشطين',
    'users.subtitle': 'هويات الموظفين المعتمدة في قاعدة البيانات',
    'users.storekeepers': 'أمناء المستودعات (الساحة والقاعدة)',
    'users.storekeepers_sub': 'أمناء العهد المخولين بالاستلام والصرف',
    'users.procurement': 'مسؤولو المشتريات',
    'users.procurement_sub': 'معتمدو طلبات الشراء',
    'users.active_shift': 'الوردية التشغيلية النشطة',
    'users.directory_title': 'دليل الموظفين والأدوار التشغيلية',
    'users.directory_desc': 'هويات موثقة مرتبطة بجميع حركات دفتر الأستاذ والتحويلات وأوامر الشراء.',
    'users.audit_active': 'نظام التدقيق ومنع الإنكار نشط',
    'users.col_employee': 'الموظف',
    'users.col_role': 'الدور والصلاحية',
    'users.col_email': 'البريد المهني',
    'users.col_status': 'الحالة',
    'users.col_movements': 'الحركات المسجلة',
    'users.col_created': 'تاريخ الإنشاء',
    'users.col_session': 'الجلسة الحالية',
    'users.active': 'نشط',
    'users.inactive': 'غير نشط',
    'users.logged_in': '✓ جلسة حالية نشطة',
    'users.switch_to_user': 'تبديل الهوية',
    'users.ledger_btn': 'دفتر الأستاذ',

    // Movement Modal
    'movement_modal.title_receipt': 'تسجيل حركة استلام بضاعة',
    'movement_modal.title_issue': 'تسجيل حركة صرف مخزني',
    'movement_modal.title_transfer': 'تسجيل حركة تحويل بين المستودعات',
    'movement_modal.title_adjust': 'تسجيل حركة تسوية جردية',
    'movement_modal.server_rejected': 'تم رفض الحركة من الخادم',
    'movement_modal.tx_mode': 'نوع الحركة',
    'movement_modal.mode_receipt': 'استلام',
    'movement_modal.mode_issue': 'صرف',
    'movement_modal.mode_transfer': 'تحويل',
    'movement_modal.mode_adjust': 'تسوية',
    'movement_modal.item_label': 'الصنف / رمز القطعة (SKU)',
    'movement_modal.source_wh': 'المستودع المصدر (من)',
    'movement_modal.wh_loc': 'موقع المستودع',
    'movement_modal.dest_wh': 'المستودع الوجهة (إلى)',
    'movement_modal.issue_dest': 'وجهة الصرف (مشروع / منصة / ورشة)',
    'movement_modal.adj_type': 'نوع التسوية',
    'movement_modal.surplus': 'فائض (+) [بضاعة زائدة بالعد]',
    'movement_modal.shrinkage': 'عجز (-) [تلف أو فاقد مخزني]',
    'movement_modal.qty_units': 'كمية الوحدات',
    'movement_modal.avail_at': 'المتاح في',
    'movement_modal.set_max': 'تحديد الكل',
    'movement_modal.ref_receipt': 'رقم أمر الشراء أو إشعار التسليم',
    'movement_modal.ref_issue': 'رقم طلب الصرف أو أمر الشغل',
    'movement_modal.ref_transfer': 'رقم بوليصة التحويل المخزني',
    'movement_modal.ref_adjust': 'رقم كشف الجرد الدوري / التدقيق',
    'movement_modal.doc_proof': 'المستند الورقي المؤيد (PDF / صور)',
    'movement_modal.optional_audit': 'اختياري • للتدقيق والمطابقة',
    'movement_modal.dropzone_text': 'انقر أو اسحب إشعار التسليم، بوليصة الشحن، أو صورة الفحص',
    'movement_modal.dropzone_hint': 'يدعم صيغ PDF, PNG, JPG حتى 15 ميجابايت',
    'movement_modal.commit_btn': 'تسجيل في دفتر الأستاذ',
    'movement_modal.recording_btn': 'جارٍ تسجيل الحركة...',
    'movement_modal.zero_stock': 'لا يوجد رصيد في هذا الموقع',
    'movement_modal.exceeds_avail': 'يتجاوز الرصيد المتاح',

    // Barcode Scanner Modal
    'scanner.title': 'مسح الباركود والبحث عن الصنف (F2)',
    'scanner.mode_gun': 'قارئ باركود USB',
    'scanner.mode_camera': 'كاميرا الجهاز',
    'scanner.search_placeholder': 'امسح الباركود، أو أدخل رمز الصنف، أو رقم أمر الشراء...',
    'scanner.presets_title': 'نماذج تجريبية سريعة (انقر للمحاكاة الفورية):',
    'scanner.inbound_docket': 'إشعار استلام شحنة واردة',
    'scanner.supplier': 'المورّد:',
    'scanner.expected': 'تاريخ الوصول المتوقع:',
    'scanner.destination': 'الوجهة:',
    'scanner.delivery_lines': 'بنود الشحنة والكميات المطلوبة:',
    'scanner.receive_btn': 'استلام البضاعة في المستودع',
    'scanner.receiving_btn': 'جارٍ الاستلام...',
    'scanner.btn_issue': 'صرف مخزني',
    'scanner.btn_receive': 'استلام بضاعة',
    'scanner.btn_print_tag': 'طباعة بطاقة الرف',
    'scanner.btn_inspect': 'فحص الصنف',
    'scanner.btn_register_new': 'تسجيل كصنف جديد',

    // New Item Modal
    'new_item.title': 'تسجيل صنف جديد في دليل المخزون',
    'new_item.sku': 'رمز الصنف / رقم القطعة (SKU)',
    'new_item.name': 'اسم الصنف أو المعدة',
    'new_item.category': 'الفئة والتصنيف',
    'new_item.uom': 'وحدة القياس',
    'new_item.unit_cost': 'سعر الوحدة بالدولار ($)',
    'new_item.criticality': 'درجة الأهمية التشغيلية',
    'new_item.initial_loc': 'موقع المستودع الأولي',
    'new_item.initial_stock': 'رصيد المخزون الافتتاحي',
    'new_item.supplier': 'المورد المعتمد',
    'new_item.vendor_sku': 'رقم القطعة لدى المورد',
    'new_item.submit_btn': 'تسجيل الصنف في الدليل',
    'new_item.saving_btn': 'جارٍ تسجيل الصنف...',
    'new_item.print_label': 'طباعة ملصق الرف',

    // Common
    'common.warehouse': 'المستودع',
    'common.status': 'الحالة',
    'common.sku': 'رمز الصنف',
    'common.quantity': 'الكمية',
    'common.units': 'وحدات',
    'common.cancel': 'إلغاء',
    'common.submit': 'إرسال',
    'common.confirm': 'تأكيد',
    'common.close': 'إغلاق',
  },
} as const;

export type TranslationKey = keyof typeof translations.en | string;

export function translateCategory(name: string, locale: Locale): string {
  if (locale !== 'ar') return name;
  const map: Record<string, string> = {
    'Mechanical Parts': 'قطع غيار ميكانيكية',
    'Pipes & Tubes': 'أنابيب ومواسير',
    'Valves & Fittings': 'صمامات وملحقاتها',
    'Valves': 'صمامات',
    'Pipes': 'أنابيب',
    'Drill Parts': 'قطع حفر وتثقيب',
    'Chemicals': 'كيماويات وسوائل حفر',
    'Tools & Equipment': 'عدد ومعدات',
    'Tools': 'عدد ومعدات',
    'Others': 'أخرى',
    'Test Category': 'فئة تجريبية',
    'General': 'عام',
  };
  return map[name] || name;
}

export function translateWarehouse(name: string, locale: Locale): string {
  if (locale !== 'ar') return name;
  const map: Record<string, string> = {
    'Central Warehouse (Cairo Base)': 'المستودع المركزي (قاعدة القاهرة)',
    'Western Desert Field Yard': 'ساحة الحقل بالصحراء الغربية',
    'Gulf of Suez Rig Site 07': 'موقع منصة خليج السويس 07',
    'Main Warehouse': 'المستودع الرئيسي',
    'Field Warehouse': 'مستودع الحقل',
    'Remote Site': 'الموقع الميداني البعيد',
  };
  return map[name] || name;
}

export function translateMovementType(type: string, locale: Locale): string {
  if (locale !== 'ar') return type;
  const map: Record<string, string> = {
    'RECEIPT': 'استلام',
    'ISSUE': 'صرف',
    'TRANSFER': 'تحويل',
    'TRANSFER_OUT': 'تحويل صادر',
    'TRANSFER_IN': 'تحويل وارد',
    'ADJUSTMENT': 'تسوية',
    'Receipt': 'استلام',
    'Issue': 'صرف',
    'Transfer': 'تحويل',
    'Adjustment': 'تسوية',
  };
  return map[type] || type;
}

export function translateRelativeTime(text: string, locale: Locale): string {
  if (locale !== 'ar') return text;
  return text
    .replace(/(\d+)h ago/g, 'منذ $1 ساعات')
    .replace(/1h ago/g, 'منذ ساعة')
    .replace(/2h ago/g, 'منذ ساعتين')
    .replace(/(\d+)d ago/g, 'منذ $1 أيام')
    .replace(/1d ago/g, 'منذ يوم')
    .replace(/2d ago/g, 'منذ يومين')
    .replace(/just now/gi, 'الآن');
}

export function translatePOStatus(status: string, locale: Locale): string {
  if (locale !== 'ar') {
    if (status === 'PARTIALLY_RECEIVED') return 'Partially Received';
    return status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ');
  }
  const map: Record<string, string> = {
    'DRAFT': 'مسودة',
    'APPROVED': 'معتمد',
    'PARTIALLY_RECEIVED': 'مستلم جزئياً',
    'RECEIVED': 'مستلم بالكامل',
    'CANCELLED': 'ملغي',
  };
  return map[status] || status;
}

export function translateUrgency(urgency: string, locale: Locale): string {
  if (locale !== 'ar') {
    if (urgency === 'CRITICAL') return 'Critical Risk';
    if (urgency === 'HIGH') return 'High Urgency';
    return 'Normal';
  }
  const map: Record<string, string> = {
    'CRITICAL': 'خطر حرج',
    'HIGH': 'أهمية عالية',
    'NORMAL': 'عادي',
  };
  return map[urgency] || urgency;
}

export function translateDemandPattern(pattern: string, locale: Locale): string {
  if (locale !== 'ar') return pattern;
  const map: Record<string, string> = {
    'INTERMITTENT': 'طلب متقطع',
    'LUMPY': 'طلب متذبذب',
    'ERRATIC': 'طلب عشوائي',
    'SMOOTH': 'طلب منتظم',
  };
  return map[pattern.toUpperCase()] || pattern;
}

export function translateUserRole(role: string, locale: Locale): string {
  if (locale !== 'ar') {
    return role.replace('_', ' ').toLowerCase();
  }
  const map: Record<string, string> = {
    'STOREKEEPER': 'أمين مستودع',
    'PROCUREMENT': 'مسؤول مشتريات',
    'AUDITOR': 'مدقق مالي ومخزني',
    'ADMIN': 'مدير المستودع والمنظومة',
  };
  return map[role.toUpperCase()] || role;
}

export function translateRecommendationSummary(
  textOrRec: any,
  locale: Locale
): string {
  const text = typeof textOrRec === 'string' ? textOrRec : (textOrRec?.summary_text || '');

  if (locale !== 'ar') {
    if (typeof textOrRec !== 'string' && !text) {
      return `Replenishment proposal for SKU ${textOrRec?.item_sku || ''}`;
    }
    return text;
  }

  // 1. Match full backend AI proposal template:
  // "Replenishment proposed for CHOKE-VLV-111C74 (High-Pressure Choke Valve Assembly 2-1/16in). Current position is 3 (on-hand: 3, open POs: 0), which is below ROP threshold of 3. Recommending 1 units from preferred supplier to restore position to target 4 (service level: 95%)."
  if (text) {
    const fullMatch = text.match(
      /Replenishment proposed for\s+([^\s]+)\s*\((.+?)\)\.\s*Current position is\s*(\d+)\s*\(on-hand:\s*(\d+),\s*open POs:\s*(\d+)\),\s*which is below ROP threshold of\s*(\d+)\.\s*Recommending\s*(\d+)\s*units from preferred supplier to restore position to target\s*(\d+)\s*\(service level:\s*(\d+)%\)\.?/i
    );

    if (fullMatch) {
      const [, sku, itemName, curPos, onHand, openPOs, rop, recQty, target, sl] = fullMatch;
      return `مقترح إعادة طلب للصنف ${sku.trim()} (${itemName.trim()}). الرصيد الحالي ${curPos} (المتوفر: ${onHand}، أوامر معلقة: ${openPOs})، وهو أقل من حد الطلب ${rop}. يُوصى بطلب ${recQty} وحدة من المورّد المفضل لاستعادة المخزون إلى المستوى المستهدف ${target} (مستوى الخدمة: ${sl}%).`;
    }

    // 2. Match partial backend pattern:
    const partialMatch = text.match(
      /Replenishment proposed for\s+([^\(]+?)(?:\s*\(([^\)]+?)\))?\.\s*Current position is\s*(\d+).*?below ROP threshold of\s*(\d+).*?Recommending\s*(\d+)\s*units/i
    );

    if (partialMatch) {
      const [, sku, itemName, curPos, rop, recQty] = partialMatch;
      const namePart = itemName ? ` (${itemName.trim()})` : '';
      return `مقترح إعادة طلب للصنف ${sku.trim()}${namePart}. الرصيد الحالي ${curPos}، وهو أقل من حد الطلب ${rop}. يُوصى بطلب ${recQty} وحدة من المورّد المعتمد.`;
    }

    // 3. Simple proposal match:
    const simpleMatch = text.match(/Replenishment proposal for SKU\s*([^\.]+)/i);
    if (simpleMatch) {
      return `مقترح إعادة تزويد وتوريد للصنف ${simpleMatch[1].trim()}`;
    }
  }

  // 4. Object-based translation if recommendation object is provided:
  if (typeof textOrRec === 'object' && textOrRec !== null && textOrRec.item_sku) {
    const sku = textOrRec.item_sku;
    const itemName = textOrRec.item_name || 'قطعة غيار';
    const pos = textOrRec.inventory_position ?? textOrRec.on_hand ?? 0;
    const onHand = textOrRec.on_hand ?? 0;
    const onOrder = textOrRec.on_order ?? 0;
    const rop = textOrRec.reorder_point ?? 0;
    const recQty = textOrRec.suggested_qty ?? 1;
    let target = rop + recQty;
    let sl = 95;
    if (textOrRec.explanation_json) {
      try {
        const exp = JSON.parse(textOrRec.explanation_json);
        if (exp.order_up_to) target = exp.order_up_to;
        if (exp.service_level) sl = Math.round(exp.service_level * 100);
      } catch {}
    }
    return `مقترح إعادة طلب للصنف ${sku} (${itemName}). الرصيد الحالي ${pos} (المتوفر: ${onHand}، أوامر معلقة: ${onOrder})، وهو أقل من حد الطلب ${rop}. يُوصى بطلب ${recQty} وحدة من المورّد المفضل لاستعادة المخزون إلى المستوى المستهدف ${target} (مستوى الخدمة: ${sl}%).`;
  }

  return text || 'مقترح توريد ذكي من نظام التنبؤ بالطلب';
}

export function translateMovementReason(reason: string | undefined | null, locale: Locale): string {
  if (!reason) return '';
  if (locale !== 'ar') return reason;
  const lower = reason.toLowerCase().trim();
  if (lower.includes('field site transfer')) return 'تحويل موقع ميداني';
  if (lower.includes('routine maintenance') || lower.includes('routine overhaul')) return 'صرف قطع غيار للصيانة الروتينية';
  if (lower.includes('emergency') || lower.includes('breakdown')) return 'إصلاح عطل طارئ لمنصة الحفر';
  if (lower.includes('initial stock') || lower.includes('initial warehouse')) return 'تهيئة المخزون الافتتاحي';
  if (lower.includes('standard operational')) return 'معاملة مستودعية تشغيلية قياسية';
  if (lower.includes('cycle count') || lower.includes('physical count')) return 'مطابقة الجرد الدوري الفعلي';
  if (lower.includes('replenishment')) return 'إعادة تزويد المستودع';
  if (lower.includes('supplier delivery') || lower.includes('vendor delivery')) return 'توريد مباشر من المورد';
  if (lower.includes('manual receipt')) return 'استلام يدوي';
  if (lower.includes('manual issue')) return 'صرف يدوي';
  if (lower.includes('manual adjustment')) return 'تسوية جردية يدوية';
  return reason;
}


