import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mehfil",
    short_name: "Mehfil",
    description: "Party games for family gatherings",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      {
        src: "/api/icon?size=192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/api/icon?size=512",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
