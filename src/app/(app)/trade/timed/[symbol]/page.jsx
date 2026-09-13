import { tradePageMetadata, TradePage } from "@/features/trading/components/trade-page";

export const generateMetadata = (page) => tradePageMetadata(page, "timed");

const TimedTradePage = (page) => <TradePage {...page} market="timed" />;

export default TimedTradePage;