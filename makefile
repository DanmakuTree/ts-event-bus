# run: 
# 	tsc src/index.ts -outDir build && node test/test.ts
run-build:
	tsc --outDir build

run-dist: 
	tsc --build tsconfig.json