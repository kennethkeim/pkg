export const getUrlPathForError = (url: string): string => {
  try {
    let pathname = url
    if (url) pathname = new URL(url).pathname
    if (pathname.length < 2) pathname = url
    return pathname.replaceAll(/[0-9]{13}/g, "[id]")
  } catch (err) {
    console.error(err)
    return url
  }
}
