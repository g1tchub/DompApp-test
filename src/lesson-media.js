// Shared by the player and build validation so a release cannot omit its media.
export const lessonMedia = {
  images: {
    video: "./assets/lessons/lemon-scene.mp4",
    poster: "./assets/lessons/lemon-scene-final.png",
  },
  ...Object.fromEntries(
    [
      "first-win",
      "my-journey",
      "independent",
      "linking",
      "real-life",
      "reflect",
    ].map((id) => [
      id,
      {
        video: `./assets/lessons/${id}-scene.mp4`,
        poster: `./assets/lessons/${id}-scene-final.png`,
      },
    ]),
  ),
};
