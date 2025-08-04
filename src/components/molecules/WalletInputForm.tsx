import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Search, Loader2, Sparkles, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Helper function to validate EVM address format
const isValidEVMAddress = (address: string): boolean => {
  // Basic format check
  const evmAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!evmAddressRegex.test(address)) {
    return false;
  }

  // Additional validation: check for mixed case checksum (optional but recommended)
  // This is a simplified check - in production you might want to use a library like ethers.js
  // For now, we'll just ensure it's a valid hex string of the correct length
  return true;
};

// Zod schema for wallet address validation
const walletAddressSchema = z.object({
  walletAddress: z
    .string()
    .min(1, "Wallet address is required")
    .refine(isValidEVMAddress, {
      message:
        "Please enter a valid EVM wallet address (0x followed by 40 hex characters)",
    }),
});

type WalletAddressFormData = z.infer<typeof walletAddressSchema>;

export interface WalletInputFormProps {
  onSubmit: (walletAddress: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const WalletInputForm: React.FC<WalletInputFormProps> = ({
  onSubmit,
  isLoading = false,
  disabled = false,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<WalletAddressFormData>({
    resolver: zodResolver(walletAddressSchema),
    mode: "onChange", // Validate on change for real-time feedback
  });

  const walletAddress = watch("walletAddress");
  const hasValue = walletAddress && walletAddress.trim() !== "";

  const onSubmitForm = (data: WalletAddressFormData) => {
    onSubmit(data.walletAddress);
  };

  const handleClear = () => {
    reset();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmitForm)}
      className="w-full max-w-lg space-y-6"
    >
      <div className="space-y-4">
        <label
          htmlFor="wallet-address"
          className="text-sm font-medium text-foreground flex items-center space-x-2"
        >
          <Search className="h-4 w-4 text-purple-400" />
          <span>Wallet Address</span>
        </label>
        <div className="relative">
          <Input
            id="wallet-address"
            type="text"
            placeholder="Enter your wallet address"
            disabled={disabled || isLoading}
            className={cn(
              "w-full pr-10 transition-all duration-200 !border-white text-white",
              errors.walletAddress
                ? "!border-red-500 focus:ring-2 focus:ring-red-500/20"
                : hasValue && isValid
                ? "!border-green-500 focus:ring-2 focus:ring-green-500/20"
                : "focus:ring-2 focus:ring-purple-500/20"
            )}
            {...register("walletAddress")}
          />

          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
            </div>
          )}

          {/* Error indicator */}
          {!isLoading && errors.walletAddress && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
          )}

          {/* Clear button */}
          {!isLoading && hasValue && !errors.walletAddress && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
            </button>
          )}
        </div>
      </div>

      {/* Helper Text */}
      {!hasValue && !errors.walletAddress && (
        <p className="text-xs text-muted-foreground">
          Format: 0x followed by 40 hexadecimal characters (0-9, a-f, A-F)
        </p>
      )}

      {/* Error Message */}
      {errors.walletAddress && (
        <div className="flex items-center space-x-2 text-red-400 text-sm animate-fade-in">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errors.walletAddress.message}</span>
        </div>
      )}

      <Button
        type="submit"
        disabled={!hasValue || !isValid || disabled || isLoading}
        className="w-full group relative overflow-hidden h-12 text-base font-medium"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Checking...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2 group-hover:animate-pulse" />
            Check On-Chain Activity
          </>
        )}
      </Button>
    </form>
  );
};
