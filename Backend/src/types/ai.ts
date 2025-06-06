export interface Transfer {
  value: number;
  erc721TokenId: string | null;
  erc1155Metadata: unknown | null;
  tokenId: string | null;
  asset: string;
  category: string;
  network: 'mainnet' | 'sepolia'; // Added network field
}

export interface TransfersData {
  erc20Transfers: any[];
  nativeTransfers: any[];
  internalTransfers: any[];
}
