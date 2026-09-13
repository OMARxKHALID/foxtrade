import { tradePageMetadata, TradePage } from "@/features/trading/components/trade-page";

export const generateMetadata = (page) => tradePageMetadata(page, "perpetual");

const PerpetualTradePage = (page) => <TradePage {...page} market="perpetual" />;

export default PerpetualTradePage;