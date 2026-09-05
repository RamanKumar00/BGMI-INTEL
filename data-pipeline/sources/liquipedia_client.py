import time
import os
import requests
import yaml

class LiquipediaClient:
    def __init__(self, config_path="config/sources.yaml"):
        # Load default configuration
        self.enabled = True
        self.endpoint = "https://liquipedia.net/pubgmobile/api.php"
        self.rate_limit_seconds = 2.0
        self.user_agent = "BGMIIntelETL/1.0 (contact@bgmi-intel.com)"

        # Override with config file if available
        if os.path.exists(config_path):
            try:
                with open(config_path, "r") as f:
                    config = yaml.safe_load(f)
                    liq_config = config.get("sources", {}).get("liquipedia", {})
                    self.enabled = liq_config.get("enabled", self.enabled)
                    self.endpoint = liq_config.get("endpoint", self.endpoint)
                    self.wiki = liq_config.get("wiki", "pubgmobile")
                    self.rate_limit_seconds = float(liq_config.get("rate_limit_seconds", self.rate_limit_seconds))
                    self.user_agent = os.getenv("LIQUIPEDIA_USER_AGENT", liq_config.get("user_agent", self.user_agent))
            except Exception as e:
                print(f"Warning: Failed to load config/sources.yaml: {e}. Using defaults.")

        self.last_request_time = 0.0

    def _wait_for_rate_limit(self):
        """Enforces a strict delay between requests to Liquipedia servers"""
        now = time.time()
        elapsed = now - self.last_request_time
        if elapsed < self.rate_limit_seconds:
            sleep_duration = self.rate_limit_seconds - elapsed
            time.sleep(sleep_duration)
        self.last_request_time = time.time()

    def _request(self, params):
        if not self.enabled:
            raise Exception("Liquipedia client is disabled in configuration.")

        self._wait_for_rate_limit()
        
        headers = {
            "User-Agent": self.user_agent,
            "Accept-Encoding": "gzip"
        }
        
        response = requests.get(self.endpoint, params=params, headers=headers)
        if response.status_code == 429:
            print("Warning: Received 429 Rate Limit from Liquipedia. Backing off for 10 seconds...")
            time.sleep(10)
            return self._request(params)
            
        response.raise_for_status()
        return response.json()

    def fetch_category_members(self, category, limit=50):
        """Fetches list of pages inside a specific category"""
        params = {
            "action": "query",
            "list": "categorymembers",
            "cmtitle": f"Category:{category}",
            "cmlimit": limit,
            "format": "json"
        }
        data = self._request(params)
        members = data.get("query", {}).get("categorymembers", [])
        return members

    def fetch_page_content(self, title):
        """Fetches raw wikitext content of a specific page"""
        params = {
            "action": "query",
            "prop": "revisions",
            "titles": title,
            "rvprop": "content",
            "format": "json"
        }
        data = self._request(params)
        pages = data.get("query", {}).get("pages", {})
        for _, page in pages.items():
            revisions = page.get("revisions", [])
            if revisions:
                return {
                    "title": title,
                    "content": revisions[0].get("*", ""),
                    "pageid": page.get("pageid")
                }
        return None

    def ask_query(self, query):
        """Executes a Semantic MediaWiki ASK query to extract structured variables"""
        params = {
            "action": "ask",
            "query": query,
            "format": "json"
        }
        data = self._request(params)
        return data.get("query", {}).get("results", {})
