import { tradePageMetadata, TradePage } from "@/features/trading/components/trade-page";

export const generateMetadata = (page) => tradePageMetadata(page, "perpetual");

export const instant = false;

const PerpetualTradePage = (page) => <TradePage {...page} market="perpetual" />;

export default PerpetualTradePage;