import { IsEmail, IsString, MinLength, Matches, IsBoolean } from 'class-validator';

export class CadastroDto {
  @IsString() @MinLength(2) nome: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, { message: 'Senha deve ter letras e números' })
  senha: string;
}

export class LoginDto {
  @IsEmail() email: string;
  @IsString() senha: string;
}

export class EsqueciSenhaDto { @IsEmail() email: string; }

export class RedefinirSenhaDto {
  @IsString() token: string;
  @IsString() @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/) novaSenha: string;
}

export class RefreshDto { @IsString() refreshToken: string; }

export class BiometriaDto { @IsBoolean() ativa: boolean; }
