import { CoinIcon } from "@/components/icons/coin-icon";
import { networks, wallets } from "@/features/assets/data/assets-config";

export const toAssetOptions = (assets) =>
  assets.map((asset) => ({
    value: asset.symbol,
    label: asset.symbol,
    icon: <CoinIcon symbol={asset.symbol} color={asset.color} size="sm" />,
  }));

export const networkOptions = networks.map((network) => ({ value: network, label: network }));

export const walletOptions = wallets.map((wallet) => ({ value: wallet.value, label: wallet.label }));
