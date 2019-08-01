module.exports = {
	plugins: [
		"remark-preset-lint-style-guide",
		"remark-preset-lint-recommended",
		[
			"remark-lint-no-html",
			false
		],
		[
			"remark-lint-no-tabs",
			false
		]
	]
}