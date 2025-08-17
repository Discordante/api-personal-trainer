import { plainToInstance } from 'class-transformer';
import { IsEnum, IsInt, IsString, Min, validateSync } from 'class-validator';

export enum NodeEnv {
  Local = 'local',
  Development = 'development',
  Test = 'test',
  Staging = 'staging',
  Production = 'production',
}

export class EnvVariables {
  @IsEnum(NodeEnv)
  NODE_ENV!: NodeEnv;

  @IsInt()
  @Min(1)
  PORT!: number;

  @IsString()
  API_GLOBAL_PREFIX!: string;

  @IsString()
  DOCS_PATH!: string;

  @IsString()
  DATABASE_URL!: string;
}

export function validate(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length) {
    throw new Error(
      errors
        .map((e) => `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
        .join(' | '),
    );
  }
  return validated;
}
