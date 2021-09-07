import { borsh } from "../../utils";
import { AnyPublicKey, StringPublicKey } from "../../types";
import { VaultProgram, VaultKey } from "./VaultProgram";
import { AccountInfo, PublicKey } from "@solana/web3.js";

const struct = borsh.Struct.create;

export interface SafetyDepositBoxData {
  /// Each token type in a vault has it's own box that contains it's mint and a look-back
  key: VaultKey;
  /// VaultKey pointing to the parent vault
  vault: StringPublicKey;
  /// This particular token's mint
  tokenMint: StringPublicKey;
  /// Account that stores the tokens under management
  store: StringPublicKey;
  /// the order in the array of registries
  order: number;
}

const safetyDepositStruct = struct<SafetyDepositBoxData>(
  [
    ["key", "u8"],
    ["vault", "pubkeyAsString"],
    ["tokenMint", "pubkeyAsString"],
    ["store", "pubkeyAsString"],
    ["order", "u8"],
  ],
  [],
  (data) => {
    data.key = VaultKey.SafetyDepositBoxV1;
    return data;
  }
);

export class SafetyDepositBox extends VaultProgram<SafetyDepositBoxData> {
  constructor(key: AnyPublicKey, info?: AccountInfo<Buffer>) {
    super(key, info);

    if (
      this.info &&
      this.isOwner() &&
      SafetyDepositBox.isSafetyDepositBox(this.info.data)
    ) {
      this.data = safetyDepositStruct.deserialize(this.info.data);
    }
  }

  static async getPDA(vault: AnyPublicKey, mint: AnyPublicKey) {
    return await SafetyDepositBox.findProgramAddress(
      [
        Buffer.from(VaultProgram.PREFIX),
        VaultProgram.toPublicKey(vault).toBuffer(),
        VaultProgram.toPublicKey(mint).toBuffer(),
      ],
      VaultProgram.PUBKEY
    );
  }

  static isSafetyDepositBox(data: Buffer) {
    return data[0] === VaultKey.SafetyDepositBoxV1;
  }
}