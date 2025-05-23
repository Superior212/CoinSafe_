import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import fundingFacetAbi from "../../abi/FundingFacet.json";
import { CoinsafeDiamondContract } from "@/lib/contract";
import { LoaderCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useDepositAsset } from "@/hooks/useDepositAsset";
import { useActiveAccount } from "thirdweb/react";
import { getContract } from "thirdweb";
import { client, liskSepolia } from "@/lib/config";
import { getBalance } from "thirdweb/extensions/erc20";
import MemoRipple from "@/icons/Ripple";
import SuccessfulTxModal from "./SuccessfulTxModal";
import { getTokenPrice } from "@/lib";
import ApproveTxModal from "./ApproveTxModal";
import { tokenData } from "@/lib/utils";
import { supportedTokensState } from "@/store/atoms/balance";
import { useRecoilState } from "recoil";

export default function Deposit({
  isDepositModalOpen,
  setIsDepositModalOpen,
}: {
  isDepositModalOpen: boolean;
  setIsDepositModalOpen: (open: boolean) => void;
  onBack: () => void;
}) {
  const [isThirdModalOpen, setIsThirdModalOpen] = useState(false);
  const [approveTxModalOpen, setApproveTxModalOpen] = useState(false);
  const smartAccount = useActiveAccount();
  const address = smartAccount?.address;

  const [amount, setAmount] = useState<number>();
  const [token, setToken] = useState("");
  const [tokenPrice, setTokenPrice] = useState("0.00");
  const [selectedTokenBalance, setSelectedTokenBalance] = useState(0);

  const [supportedTokens] = useRecoilState(supportedTokensState);

  const openThirdModal = () => {
    setIsThirdModalOpen(true);
    setIsDepositModalOpen(false);
  };

  const promptApproveModal = () => {
    setApproveTxModalOpen(true);
  };

  const handleTokenSelect = (value: string) => {
    setToken(value);
  };

  const { depositAsset, isLoading } = useDepositAsset({
    address: address as `0x${string}`,
    account: smartAccount,
    token: token as `0x${string}`,
    amount,
    // coinSafeAddress: CoinSafeContract.address as `0x${string}`,
    coinSafeAddress: CoinsafeDiamondContract.address as `0x${string}`,
    coinSafeAbi: fundingFacetAbi,
    onSuccess: () => {
      openThirdModal();
    },
    onApprove: () => {
      promptApproveModal();
    },
    onError: (error) => {
      toast({
        title: error.message,
        variant: "destructive",
      });
    },
    toast,
  });

  useEffect(() => {
    const updatePrice = async () => {
      const price: string = await getTokenPrice(token, amount);
      setTokenPrice(price);
    };
    updatePrice();
  }, [token, amount]);

  useEffect(() => {
    async function fetchTokenBalance() {
      try {
        const contract = getContract({
          client,
          address: token,
          // abi: erc20Abi,
          chain: liskSepolia,
        });

        const tokenBalance = await getBalance({ contract, address: address! });

        // console.log("tokenBalance:: ", tokenBalance);
        setSelectedTokenBalance(Number(tokenBalance.displayValue));
      } catch (error) {
        console.error(error);
        throw new Error(error as any);
      }
    }

    if (address && token) {
      fetchTokenBalance();
    }
  }, [token, address]);

  return (
    <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
      <DialogContent className="w-11/12 sm:max-w-[600px] border-0 text-white bg-[#17171C]">
        <DialogTitle className="text-white flex items-center">
          <p>Deposit Assets</p>
        </DialogTitle>
        <div className="py-4 text-gray-700">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Amount</label>
            <div className="flex items-center justify-between p-6 bg-transparent border border-[#FFFFFF3D] rounded-xl relative">
              <div className="flex flex-col items-start">
                <input
                  type="number"
                  value={amount}
                  onChange={(e: any) => setAmount(e.target.value)}
                  className="text-2xl font-medium bg-transparent text-white w-16 sm:w-full outline-none"
                  placeholder="0"
                />
                <div className="text-sm text-left text-gray-400 mt-1">
                  ≈ ${tokenPrice}
                </div>
              </div>
              <div className="sm:ml-4">
                <Select onValueChange={handleTokenSelect} value={token}>
                  <SelectTrigger className="w-[160px] border border-[#FFFFFF3D] bg-[#3F3F3F99]/60 text-white rounded-md">
                    <div className="flex items-center">
                      <MemoRipple className="mr-2" />
                      <SelectValue placeholder="Select Token" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {supportedTokens.map((token) => (
                      <SelectItem value={token} key={token}>
                        {tokenData[token]?.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Wallet Balance Section */}
          {token && (
            <>
              {amount && amount > selectedTokenBalance && (
                <p className="text-red-500 text-[13px] mt-1 text-right">
                  Amount greater than wallet balance
                </p>
              )}
              <div className="flex items-center justify-between my-2">
                <div className="text-sm font-[300] text-gray-300">
                  Wallet balance:{" "}
                  <span className="text-gray-400">
                    {selectedTokenBalance} {tokenData[token]?.symbol}
                  </span>
                </div>
                {token &&
                (selectedTokenBalance == 0 ||
                  (amount && amount > selectedTokenBalance)) ? (
                  <Link to={"/dashboard/deposit"}>
                    <Button
                      variant="link"
                      className="text-[#79E7BA] hover:text-[#79E7BA]/80 p-0"
                    >
                      Deposit to save
                    </Button>
                  </Link>
                ) : (
                  <Button
                    className="text-sm border-none outline-none bg-transparent hover:bg-transparent text-green-400 cursor-pointer"
                    onClick={() => setAmount(selectedTokenBalance)}
                  >
                    Max
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
        <DialogFooter className="">
          <div className="flex sm:space-x-4 justify-between mt-2">
            <Button
              onClick={() => setIsDepositModalOpen(false)}
              className="bg-[#1E1E1E99] px-8 rounded-[2rem] hover:bg-[#1E1E1E99]"
              type="submit"
            >
              Cancel
            </Button>

            <Button
              onClick={(e) => {
                depositAsset(e);
              }}
              className="text-black px-8 rounded-[2rem]"
              variant="outline"
              disabled={isLoading || (amount || 0) > selectedTokenBalance}
            >
              {isLoading ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                "Deposit assets"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
      <SuccessfulTxModal
        amount={amount || 0}
        token={tokenData[token]?.symbol}
        isOpen={isThirdModalOpen}
        onClose={() => setIsThirdModalOpen(false)}
        transactionType="deposit"
        additionalDetails={{
          subText: "Assets will be available in your wallet.",
        }}
      />

      <ApproveTxModal
        isOpen={approveTxModalOpen}
        onClose={() => setApproveTxModalOpen(false)}
        amount={amount || 0}
        token={tokenData[token]?.symbol}
        text="To Deposit"
      />
    </Dialog>
  );
}
