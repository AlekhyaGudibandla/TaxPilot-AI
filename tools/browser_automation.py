"""
TaxPilot AI - Browser Automation Tool
======================================
Playwright-based GST portal automation.
Operates in simulation mode when credentials are not provided.
"""

import asyncio
from typing import Optional
from loguru import logger


class GSTPortalAutomation:
    """
    Automates interactions with the Indian GST portal using Playwright.
    Falls back to simulation mode if credentials are absent or Playwright is unavailable.
    """

    GST_PORTAL_URL = "https://services.gst.gov.in/services/login"

    def __init__(
        self,
        username: Optional[str] = None,
        password: Optional[str] = None,
        headless: bool = True,
    ):
        self.username = username
        self.password = password
        self.headless = headless
        self.simulation_mode = not (username and password)
        self.browser = None
        self.page = None

        if self.simulation_mode:
            logger.info("GST Portal Automation running in SIMULATION MODE")

    # ── Public API ──────────────────────────────────────────────────

    async def login(self) -> dict:
        """Log in to the GST portal."""
        if self.simulation_mode:
            return self._sim("login", success=True,
                             message="Simulated login to GST portal successful")

        try:
            from playwright.async_api import async_playwright

            pw = await async_playwright().start()
            self.browser = await pw.chromium.launch(headless=self.headless)
            self.page = await self.browser.new_page()

            await self.page.goto(self.GST_PORTAL_URL, wait_until="networkidle")
            await self.page.fill("#username", self.username)
            await self.page.fill("#user_pass", self.password)
            await self.page.click(".btn-primary")
            await self.page.wait_for_load_state("networkidle")

            logger.info("GST Portal login successful")
            return {"status": "success", "message": "Logged in to GST Portal"}

        except Exception as e:
            logger.error(f"GST Portal login failed: {e}")
            return {"status": "error", "message": str(e)}

    async def navigate_to_filing(self) -> dict:
        """Navigate to the returns filing page."""
        if self.simulation_mode:
            return self._sim("navigate", success=True,
                             message="Simulated navigation to filing page")

        try:
            await self.page.click("text=Returns")
            await self.page.wait_for_load_state("networkidle")
            logger.info("Navigated to Returns Filing page")
            return {"status": "success", "message": "Navigated to filing page"}
        except Exception as e:
            logger.error(f"Navigation failed: {e}")
            return {"status": "error", "message": str(e)}

    async def fill_gstr3b_data(self, gstr3b_data: dict) -> dict:
        """Fill GSTR-3B summary data into the portal form."""
        if self.simulation_mode:
            return self._sim("fill_gstr3b", success=True,
                             message="Simulated GSTR-3B data entry",
                             data=gstr3b_data)

        try:
            section = gstr3b_data.get("section_3_1", {})
            await self.page.fill("#taxable_value", str(section.get("taxable_value", 0)))
            await self.page.fill("#igst_amount", str(section.get("igst", 0)))
            await self.page.fill("#cgst_amount", str(section.get("cgst", 0)))
            await self.page.fill("#sgst_amount", str(section.get("sgst", 0)))

            logger.info("GSTR-3B data filled successfully")
            return {"status": "success", "message": "GSTR-3B data filled"}
        except Exception as e:
            logger.error(f"GSTR-3B fill failed: {e}")
            return {"status": "error", "message": str(e)}

    async def close(self) -> None:
        """Close browser resources."""
        if self.browser:
            await self.browser.close()
            logger.info("Browser closed")

    # ── Full Workflow ──────────────────────────────────────────────

    async def run_full_workflow(self, gstr3b_data: dict) -> list[dict]:
        """Execute the complete GST filing automation workflow."""
        results: list[dict] = []

        login_result = await self.login()
        results.append({"step": "login", **login_result})

        if login_result.get("status") != "success":
            return results

        nav_result = await self.navigate_to_filing()
        results.append({"step": "navigate", **nav_result})

        fill_result = await self.fill_gstr3b_data(gstr3b_data)
        results.append({"step": "fill_data", **fill_result})

        await self.close()
        results.append({"step": "close", "status": "success", "message": "Session closed"})

        return results

    # ── Simulation helpers ─────────────────────────────────────────

    @staticmethod
    def _sim(step: str, success: bool, message: str, data: dict = None) -> dict:
        logger.info(f"[SIMULATION] {step}: {message}")
        result = {
            "status": "success" if success else "error",
            "message": message,
            "simulation": True,
        }
        if data:
            result["data"] = data
        return result


def run_automation(gstr3b_data: dict,
                   username: str = None,
                   password: str = None) -> list[dict]:
    """Synchronous wrapper for the full GST portal automation workflow."""
    bot = GSTPortalAutomation(username=username, password=password)
    return asyncio.run(bot.run_full_workflow(gstr3b_data))
