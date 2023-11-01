// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import Parser from "tree-sitter"
import Javascript from "tree-sitter-javascript"
import Typescript from "tree-sitter-typescript"
import Json from "tree-sitter-json"
import Html from "tree-sitter-html"
import Css from "tree-sitter-css"

interface Args {
  fileExtension: string
}

const parser = new Parser()
const jsFileExtensions = ["js", "cjs", "mjs"]

export const setParserLanguage = ({ fileExtension }: Args) => {
  if (jsFileExtensions.includes(fileExtension)) {
    parser.setLanguage(Javascript)
  } else if (fileExtension === "ts") {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    parser.setLanguage(Typescript.typescript)
  } else if (fileExtension === "tsx") {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    parser.setLanguage(Typescript.tsx)
  } else if (fileExtension === "json") {
    parser.setLanguage(Json)
  } else if (fileExtension === "html") {
    parser.setLanguage(Html)
  } else if (fileExtension === "css") {
    parser.setLanguage(Css)
  } else {
    parser.setLanguage(Javascript)
  }
  return parser
}
