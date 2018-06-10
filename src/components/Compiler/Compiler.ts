import * as fs from "fs";
import * as path from "path";
import { DirHelper } from "../../helpers/DirHelper";
import { TypeHelper } from "../../helpers/TypeHelper";
import { CompilerOutput } from "../../interfaces/CompilerOutput";
import { ExportModel } from "../../models/ExportModel";
import { ClassConverter } from "../Converters/ClassConverter";
import { BaseCompiler } from "./base/BaseCompiler";

export class Compiler extends BaseCompiler {
    public exports: ExportModel[];

    public constructor(outputDir: string) {
        super();

        this.classPath = path.resolve(outputDir);
    }

    public async compileFolder(schemaPath: string): Promise<void> {
        this.schemaPath = schemaPath;

        try {
            fs.readdir(this.schemaPath, async (err, files) => {
                for (const file of files) {
                    const data = fs.readFileSync(this.schemaPath + "/" + file).toString();

                    await this.compile(data);
                }
            });
        } catch (err) {
            console.log(err);
        }
    }

    public async compile(data: any): Promise<CompilerOutput> {
        const classConverter = new ClassConverter();
        data = classConverter.getData(data);

        const namespace = data.namespace.replace(".", "/");
        const outputDir = `${this.classPath}/${namespace}`;

        if (TypeHelper.isRecordType(data)) {
            classConverter.convert(data);
        }

        const result = classConverter.joinExports();

        DirHelper.mkdirIfNotExist(outputDir);
        this.saveEnums(classConverter.enumExports, outputDir);
        this.saveClass(outputDir, data, result);
        console.log(`Wrote ${data.name}.ts in ${outputDir}`);

        return {
            class: data.name,
            dir: outputDir,
        };
    }

    protected saveClass(outputDir: string, data: any, result: string) {
        const classFile = `${outputDir}/${data.name}.ts`;
        fs.writeFileSync(classFile, result);
    }

    protected saveEnums(enums: ExportModel[], outputDir: string) {
        for (const enumFile of enums) {
            const savePath = `${outputDir}/${enumFile.name}Enum.ts`;

            fs.writeFileSync(savePath, enumFile.content);
        }
    }
}