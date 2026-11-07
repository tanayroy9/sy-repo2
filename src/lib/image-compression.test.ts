import { afterEach, describe, expect, it, vi } from "vitest";
import { compressedImageSize, encodeImageCanvas, imageFileExtension, validateImage } from "./image-compression";

afterEach(() => vi.unstubAllGlobals());

describe("image decoding compatibility", () => {
  it("validates images without createImageBitmap and releases the temporary URL", async () => {
    vi.stubGlobal("createImageBitmap", undefined);
    const revoke = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: () => "blob:test", revokeObjectURL: revoke });
    vi.stubGlobal("Image", class {
      onload?: () => void;
      set src(_url: string) { this.onload?.(); }
    });
    await expect(validateImage(new Blob(["image"], { type: "image/png" }))).resolves.toBeUndefined();
    expect(revoke).toHaveBeenCalledWith("blob:test");
  });
  it("rejects unreadable images and releases their URL", async () => {
    const revoke = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: () => "blob:invalid", revokeObjectURL: revoke });
    vi.stubGlobal("Image", class {
      onerror?: () => void;
      set src(_url: string) { this.onerror?.(); }
    });
    await expect(validateImage(new Blob(["invalid"]))).rejects.toThrow("Billedet kunne ikke læses");
    expect(revoke).toHaveBeenCalledWith("blob:invalid");
  });
});

describe("image compression dimensions", () => {
  it("bounds a large phone photo before editing", () => {
    expect(compressedImageSize(6000, 4000, 2400)).toEqual({ width: 2400, height: 1600 });
  });
  it("bounds a portrait without changing its aspect ratio", () => {
    expect(compressedImageSize(3000, 6000, 1600)).toEqual({ width: 800, height: 1600 });
  });
  it("does not upscale a small logo", () => {
    expect(compressedImageSize(320, 240, 1600)).toEqual({ width: 320, height: 240 });
  });
});

describe("canvas encoding compatibility", () => {
  it("keeps WebP when supported", async () => {
    const blob = new Blob(["webp"], { type: "image/webp" });
    const canvas = document.createElement("canvas");
    vi.spyOn(canvas, "toBlob").mockImplementation((callback) => callback(blob));
    expect(await encodeImageCanvas(canvas)).toBe(blob);
    expect(imageFileExtension(blob)).toBe("webp");
  });
  it("accepts Safari's PNG fallback with the correct extension", async () => {
    const blob = new Blob(["png"], { type: "image/png" });
    const canvas = document.createElement("canvas");
    const encode = vi.spyOn(canvas, "toBlob").mockImplementation((callback) => callback(blob));
    expect(await encodeImageCanvas(canvas)).toBe(blob);
    expect(imageFileExtension(blob)).toBe("png");
    expect(encode).toHaveBeenCalledTimes(1);
  });
  it("retries PNG when WebP returns null", async () => {
    const blob = new Blob(["png"], { type: "image/png" });
    const canvas = document.createElement("canvas");
    const encode = vi.spyOn(canvas, "toBlob").mockImplementation((callback, type) => callback(type === "image/png" ? blob : null));
    expect(await encodeImageCanvas(canvas)).toBe(blob);
    expect(encode).toHaveBeenLastCalledWith(expect.any(Function), "image/png", 0.82);
  });
  it("retries PNG when the WebP encoder throws", async () => {
    const blob = new Blob(["png"], { type: "image/png" });
    const canvas = document.createElement("canvas");
    vi.spyOn(canvas, "toBlob").mockImplementation((callback, type) => {
      if (type === "image/webp") throw new Error("Unsupported encoder");
      callback(blob);
    });
    expect(await encodeImageCanvas(canvas)).toBe(blob);
  });
  it("reports failure when neither encoder produces an image", async () => {
    const canvas = document.createElement("canvas");
    vi.spyOn(canvas, "toBlob").mockImplementation((callback) => callback(null));
    await expect(encodeImageCanvas(canvas)).rejects.toThrow("Billedet kunne ikke gemmes");
  });
});