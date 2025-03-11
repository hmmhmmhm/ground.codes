import Elysia from "elysia";
import { v1Encode } from "./encode";
import { v1Decode } from "./decode";

export const v1Endpoints = new Elysia().use(v1Encode).use(v1Decode);
