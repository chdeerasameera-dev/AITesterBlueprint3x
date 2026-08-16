import httpx
from typing import Dict, Any, Optional

class AzureDevOpsConnectorService:
    async def fetch_work_item(self, organization: str, project: str, pat: str, work_item_id: str) -> Dict[str, Any]:
        url = f"https://dev.azure.com/{organization}/{project}/_apis/wit/workitems/{work_item_id}?api-version=7.1-preview.3"
        
        if not pat or "demo" in pat.lower():
            return {
                "source": "azure",
                "source_id": f"AZ-{work_item_id}",
                "title": f"[Azure DevOps #{work_item_id}] Payment Gateway Checkout Integration",
                "description": f"Implement stripe payment gateway checkout flow in project {project}.",
                "acceptance_criteria": [
                    "User selects items in cart and clicks Checkout",
                    "Payment payload sent over TLS 1.3 HTTPS",
                    "Webhook handles 200 OK payment confirmation",
                    "Failure triggers order cancellation and rollback"
                ],
                "inputs": [{"name": "card_number", "type": "string"}, {"name": "cvv", "type": "string"}],
                "expected_results": ["Receipt emailed to customer", "Order status updated to PAID"],
                "security_auth_rules": ["PCI-DSS compliant field validation", "Tokenized card numbers"],
                "error_handling_rules": ["Display user friendly error on card decline"]
            }

        headers = {"Authorization": f"Basic {pat}"}
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.get(url, headers=headers)
            res.raise_for_status()
            data = res.json()
            fields = data.get("fields", {})
            return {
                "source": "azure",
                "source_id": str(work_item_id),
                "title": fields.get("System.Title", f"WorkItem #{work_item_id}"),
                "description": fields.get("System.Description", ""),
                "acceptance_criteria": [fields.get("Microsoft.VSTS.Common.AcceptanceCriteria", "")],
                "raw_azure": data
            }

azure_connector = AzureDevOpsConnectorService()
