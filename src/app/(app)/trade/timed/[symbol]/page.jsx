import { tradePageMetadata, TradePage } from "@/features/trading/components/trade-page";

export const generateMetadata = (page) => tradePageMetadata(page, "timed");

export const instant = false;

const TimedTradePage = (page) => <TradePage {...page} market="timed" />;

export default TimedTradePage;