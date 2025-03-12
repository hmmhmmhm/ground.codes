import Elysia from "elysia";
import { v1Encode } from "./encode";
import { v1Decode } from "./decode";
import { v1RegionAround } from "./region/around";
import { v1RegionInfo } from "./region/info";

export const v1Endpoints = new Elysia()
  .use(v1Encode)
  .use(v1Decode)
  .use(v1RegionAround)
  .use(v1RegionInfo);
