import Big from "big.js";
import { Decimal128 } from "mongodb";

Big.DP = 18;

export const toBig = (value) => new Big(value?.toString?.() ?? value ?? 0);

export const toDecimal = (value) => Decimal128.fromString(toBig(value).round(8, Big.roundDown).toString());

export const toAmount = (value) => Number(toBig(value).round(8, Big.roundDown).toString());
