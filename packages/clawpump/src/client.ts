import {
  createCreatorFeeStateReceipt,
  createLaunchReceipt,
  createPayoutTopologyReceipt,
  createReleaseModeReceipt,
  createRepaymentModeReceipt,
  createRevenueEventsReceipt,
} from "./receipts";
import type {
  ClawPumpClient,
  ClawPumpClearRepaymentModeInput,
  ClawPumpResult,
  ClawPumpRevenueEventsQuery,
  ClawPumpSetRepaymentModeInput,
  ClawPumpTransport,
} from "./types";

export function createClawPumpClient(transport: ClawPumpTransport): ClawPumpClient {
  const now = () => new Date().toISOString();

  return {
    async getLaunch(mint) {
      const received_at = now();
      const result = await transport.getLaunch(mint);
      if (result.ok) {
        return {
          ok: true,
          data: result.data,
          receipt: createLaunchReceipt({ mint, received_at, meta: result.meta, launch: result.data }),
        };
      }
      return {
        ok: false,
        error: result.error,
        receipt: createLaunchReceipt({ mint, received_at, meta: result.meta, error: result.error }),
      };
    },

    async listLaunchesByWallet(wallet) {
      const received_at = now();
      const result = await transport.listLaunchesByWallet(wallet);
      if (result.ok) {
        return {
          ok: true,
          data: result.data,
          receipt: createLaunchReceipt({ wallet_query: wallet, received_at, meta: result.meta, launches: result.data }),
        };
      }
      return {
        ok: false,
        error: result.error,
        receipt: createLaunchReceipt({ wallet_query: wallet, received_at, meta: result.meta, error: result.error }),
      };
    },

    async getPayoutTopology(mint) {
      const received_at = now();
      const result = await transport.getPayoutTopology(mint);
      if (result.ok) {
        return {
          ok: true,
          data: result.data,
          receipt: createPayoutTopologyReceipt({ mint, received_at, meta: result.meta, topology: result.data }),
        };
      }
      return {
        ok: false,
        error: result.error,
        receipt: createPayoutTopologyReceipt({ mint, received_at, meta: result.meta, error: result.error }),
      };
    },

    async getCreatorFeeState(mint) {
      const received_at = now();
      const result = await transport.getCreatorFeeState(mint);
      if (result.ok) {
        return {
          ok: true,
          data: result.data,
          receipt: createCreatorFeeStateReceipt({ mint, received_at, meta: result.meta, fee_state: result.data }),
        };
      }
      return {
        ok: false,
        error: result.error,
        receipt: createCreatorFeeStateReceipt({ mint, received_at, meta: result.meta, error: result.error }),
      };
    },

    async listRevenueEvents(mint, query?: ClawPumpRevenueEventsQuery) {
      const received_at = now();
      const result = await transport.listRevenueEvents(mint, query);
      if (result.ok) {
        return {
          ok: true,
          data: result.data,
          receipt: createRevenueEventsReceipt({ mint, received_at, meta: result.meta, events: result.data }),
        };
      }
      return {
        ok: false,
        error: result.error,
        receipt: createRevenueEventsReceipt({ mint, received_at, meta: result.meta, error: result.error }),
      };
    },

    async getRepaymentMode(mint) {
      const received_at = now();
      const result = await transport.getRepaymentMode(mint);
      if (result.ok) {
        return {
          ok: true,
          data: result.data,
          receipt: createRepaymentModeReceipt({ mint, received_at, meta: result.meta, mode: result.data }),
        };
      }
      return {
        ok: false,
        error: result.error,
        receipt: createRepaymentModeReceipt({ mint, received_at, meta: result.meta, error: result.error }),
      };
    },

    async setRepaymentMode(input: ClawPumpSetRepaymentModeInput) {
      const received_at = now();
      const result = await transport.setRepaymentMode(input);
      if (result.ok) {
        return {
          ok: true,
          data: result.data,
          receipt: createRepaymentModeReceipt({ mint: input.mint, received_at, meta: result.meta, mode: result.data }),
        };
      }
      return {
        ok: false,
        error: result.error,
        receipt: createRepaymentModeReceipt({ mint: input.mint, received_at, meta: result.meta, error: result.error }),
      };
    },

    async clearRepaymentMode(input: ClawPumpClearRepaymentModeInput) {
      const received_at = now();
      const result = await transport.clearRepaymentMode(input);
      if (result.ok) {
        return {
          ok: true,
          data: result.data,
          receipt: createReleaseModeReceipt({ mint: input.mint, received_at, meta: result.meta, mode: result.data }),
        };
      }
      return {
        ok: false,
        error: result.error,
        receipt: createReleaseModeReceipt({ mint: input.mint, received_at, meta: result.meta, error: result.error }),
      };
    },
  };
}
