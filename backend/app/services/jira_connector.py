import httpx
from typing import Dict, Any, List

class JiraConnectorService:

    def _parse_adf(self, node: Any) -> str:
        """Recursively parse Atlassian Document Format (ADF) JSON structure into plain text."""
        if not node:
            return ""
        if isinstance(node, str):
            return node
        if isinstance(node, dict):
            text_parts = []
            if node.get("type") == "text":
                return node.get("text", "")
            for child in node.get("content", []):
                text_parts.append(self._parse_adf(child))
            # Handle block elements with newlines
            node_type = node.get("type", "")
            if node_type in ("paragraph", "heading", "bulletList", "orderedList", "listItem"):
                return "\n" + "".join(text_parts).strip()
            return "".join(text_parts)
        if isinstance(node, list):
            return "\n".join(self._parse_adf(item) for item in node)
        return str(node)

    async def fetch_issue(self, domain: str, email: str, api_token: str, issue_key: str) -> Dict[str, Any]:
        clean_domain = domain.replace("https://", "").replace("http://", "").strip("/")

        # Demo fallback story if user is testing with mock token
        fallback_story = {
            "id": issue_key,
            "source_id": issue_key,
            "title": f"Jira Issue {issue_key}: User Password Reset",
            "description": "As a registered user, I want to reset my password so that I can regain access to my account safely.",
            "acceptance_criteria": [
                "Given valid email, reset link is sent",
                "Given invalid email, user receives clear validation error",
                "Expired reset link returns appropriate error page"
            ],
            "issue_type": "Story",
            "status": "In Progress",
            "priority": "High"
        }

        if not api_token or api_token.lower() in ("demo", "test", "fake"):
            return {
                "selected_story": fallback_story,
                "warning": "Using mock demo data because demo token was supplied."
            }

        try:
            url = f"https://{clean_domain}/rest/api/3/issue/{issue_key}"
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.get(url, auth=(email, api_token))
                
                if res.status_code == 404:
                    return {
                        "selected_story": None,
                        "error": f"Jira Issue '{issue_key}' not found on {clean_domain}. Verify the issue key and project permissions."
                    }
                if res.status_code == 401:
                    return {
                        "selected_story": None,
                        "error": f"Authentication failed (HTTP 401). Verify Jira email ({email}) and API token."
                    }
                if res.status_code >= 400:
                    return {
                        "selected_story": None,
                        "error": f"Jira API returned HTTP {res.status_code}: {res.text[:200]}"
                    }

                data = res.json()
                fields = data.get("fields", {})

                # Summary
                summary = fields.get("summary", issue_key)

                # ADF Description
                raw_desc = fields.get("description")
                parsed_desc = self._parse_adf(raw_desc).strip() if raw_desc else "No description provided in Jira."

                # Issue Type & Status
                issue_type = fields.get("issuetype", {}).get("name", "Story")
                status_name = fields.get("status", {}).get("name", "To Do")
                priority_name = fields.get("priority", {}).get("name", "Medium")
                assignee_name = fields.get("assignee", {}).get("displayName") if fields.get("assignee") else "Unassigned"

                # Extract acceptance criteria from customfields or text
                ac_list = []
                for k, v in fields.items():
                    if "customfield" in k and v:
                        parsed_val = self._parse_adf(v).strip()
                        if any(kw in parsed_val.lower() for kw in ["given", "when", "then", "acceptance", "criteria"]):
                            ac_list.append(parsed_val)

                if not ac_list:
                    # Extract from description if bullet points exist
                    ac_list = [line.strip("- *•") for line in parsed_desc.split("\n") if any(kw in line.lower() for kw in ["given", "when", "then", "ac:", "must", "should"])]

                if not ac_list:
                    ac_list = [
                        f"System complies with requirements stated in {issue_key}",
                        "All acceptance validation checks pass during execution"
                    ]

                real_story = {
                    "id": issue_key,
                    "key": issue_key,
                    "source_id": issue_key,
                    "title": summary,
                    "summary": summary,
                    "description": parsed_desc,
                    "acceptance_criteria": ac_list,
                    "issue_type": issue_type,
                    "status": status_name,
                    "priority": priority_name,
                    "assignee": assignee_name,
                    "target_url": f"https://{clean_domain}/browse/{issue_key}"
                }

                return {"selected_story": real_story}

        except httpx.ConnectError:
            return {
                "selected_story": None,
                "error": f"Cannot connect to Jira domain '{clean_domain}'. Verify domain format (e.g. company.atlassian.net)."
            }
        except Exception as e:
            return {
                "selected_story": None,
                "error": f"Jira connector error: {str(e)}"
            }

    async def create_bug_ticket(
        self,
        domain: str,
        email: str,
        api_token: str,
        project_key: str,
        summary: str,
        description: str
    ) -> Dict[str, Any]:
        """
        Creates a Bug issue ticket in Jira for failed test scenarios.
        Returns created issue key and web URL.
        """
        clean_domain = domain.replace("https://", "").replace("http://", "").strip("/")
        if not clean_domain:
            return {"ok": False, "error": "Invalid Jira domain."}

        url = f"https://{clean_domain}/rest/api/3/issue"
        auth = (email, api_token)

        payload = {
            "fields": {
                "project": {"key": project_key.upper() or "QA"},
                "summary": summary[:255],
                "description": {
                    "type": "doc",
                    "version": 1,
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {
                                    "type": "text",
                                    "text": description
                                }
                            ]
                        }
                    ]
                },
                "issuetype": {"name": "Bug"}
            }
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, auth=auth, json=payload)
                if res.status_code in (200, 201):
                    data = res.json()
                    issue_key = data.get("key")
                    ticket_url = f"https://{clean_domain}/browse/{issue_key}"
                    return {
                        "ok": True,
                        "key": issue_key,
                        "url": ticket_url,
                        "message": f"Jira Bug {issue_key} created successfully."
                    }
                else:
                    return {
                        "ok": False,
                        "error": f"Jira issue creation returned HTTP {res.status_code}: {res.text}"
                    }
        except Exception as e:
            return {"ok": False, "error": f"Failed to create Jira bug: {str(e)}"}

jira_connector = JiraConnectorService()
