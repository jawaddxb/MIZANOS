"""Constants for ProductService — child FK tables referencing products."""

# Child tables referencing products.id via product_id, ordered so that
# tables with inter-child FK deps are deleted first.
CHILD_TABLES_BY_PRODUCT_ID = [
    "marketing_credentials",  # FK → marketing_domains, marketing_social_handles
    "document_access_links",  # FK → document_folders
    "ai_chat_sessions",
    "audits",
    "deployment_checklist_items",
    "document_folders",
    "external_document_links",
    "knowledge_entries",
    "marketing_checklist_items",
    "marketing_domains",
    "marketing_social_handles",
    "notifications",
    "product_documents",
    "product_environments",
    "product_management_notes",
    "product_members",
    "product_partner_notes",
    "project_completions",
    "project_integrations",
    "project_stakeholders",
    "qa_checks",
    "repo_scan_history",
    "repository_analyses",
    "specification_features",
    "specification_sources",
    "specifications",
    "system_documents",
    "tasks",
]
