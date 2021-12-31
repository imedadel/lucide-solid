import { readdir, readFile, writeFile } from "fs/promises"
import { cwd } from "process"
import camelcase from "camelcase"
import { optimize } from "svgo"

let staticIconsPath = cwd() + "/node_modules/lucide-static/icons"
let solidIconsPath = cwd() + "/src/icons"
let barrelFile = cwd() + "/src/index.ts"
let toSolid = (name: string, svgContent: string) =>
	`
import type { SVGProps } from "../types"
export const ${name} = (props: SVGProps) => (${svgContent.replace(
		">",
		"{...props}>"
	)})
`.trim()

let toIcon = (svgContent: string) =>
	svgContent
		.replace(/width="\d+"/, 'width="1em"')
		.replace(/height="\d+"/, 'height="1em"')

async function main() {
	let files = await readdir(staticIconsPath)
	let icons: Promise<void>[] = []
	let barrel = ""

	for (let file of files) {
		let content = await readFile(staticIconsPath + "/" + file, {
			encoding: "utf-8",
		})
		let name = file.slice(0, file.lastIndexOf("."))
		let optimized = optimize(content, {
			plugins: ["preset-default"],
		})
		let comp = toSolid(
			camelcase(name, { pascalCase: true }),
			toIcon(optimized.data)
		)

		icons.push(
			writeFile(`${solidIconsPath}/${name}.tsx`, comp, { encoding: "utf-8" })
		)

		barrel += `export * from "./icons/${name}"\n`
	}

	icons.push(writeFile(barrelFile, barrel, { encoding: "utf-8" }))

	await Promise.all(icons)
}

main()
