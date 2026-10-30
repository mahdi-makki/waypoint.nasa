// What Perseverance did at each science stop, from NASA's own records (see sources below).
export const SOURCES = {
  campaign: 'https://ntrs.nasa.gov/api/citations/20230000588/downloads/Williams%20et%20al_LPSC%202023%20Delta%20Front%20Overview%20abstract_v5.pdf',
  samples: 'https://science.nasa.gov/mission/mars-2020-perseverance/mars-rock-samples',
  wildcat: 'https://www.jpl.nasa.gov/news/nasas-perseverance-rover-investigates-geologically-rich-mars-terrain/',
  yori: 'https://jpl.nasa.gov/news/nasas-perseverance-rover-investigates-intriguing-martian-bedrock',
  kukaklek: 'https://www.jpl.nasa.gov/videos/meet-the-mars-samples-kukaklek-sample-16/'
};

export const STOP_SCIENCE = [
  {
    place: 'Skinner Ridge',
    did: 'Ground a test patch (Thornton Gap) and drilled 2 rock cores: Swift Run and Skyland.',
    why: 'Layered sedimentary rock in a cliff face of the delta.',
    sources: ['campaign', 'samples', 'wildcat']
  },
  {
    place: 'Wildcat Ridge, Hogwallow Flats',
    did: 'Ground a test patch (Berry Hollow) and drilled 2 rock cores: Hazeltop and Bearwallow.',
    why: 'Likely formed as mud and fine sand settled in an evaporating saltwater lake. Had the most abundant organic molecules detected on the mission as of 2022. Organics can form without life, so this is not proof of life.',
    sources: ['campaign', 'samples', 'wildcat']
  },
  {
    place: 'Amalik, Enchanted Lake',
    did: 'Ground a test patch (Novarupta) and drilled 2 rock cores: Shuyak and Mageik. A sealing problem delayed sealing Mageik until sol 619.',
    why: 'Among the lowest delta layers. Its readings best match magnesium-rich serpentine, a mineral that forms with water.',
    sources: ['campaign', 'samples']
  },
  {
    place: 'Yori Pass, Hidden Harbor',
    did: 'Ground a test patch (Uganik Island) and drilled 1 rock core: Kukaklek, sealed on sol 631.',
    why: 'Sandstone at the same level as Hogwallow Flats, made of fine grains carried in by water. The Kukaklek rock has various textures and colors of sulfate.',
    sources: ['campaign', 'samples', 'yori', 'kukaklek']
  }
];
