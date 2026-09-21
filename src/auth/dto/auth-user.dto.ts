import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator"

export class UserLogin {
  @IsString({message: "O nome de usuário deve ser uma string"})
  @MaxLength(120, {message: "o nome de usuário está muito grande"})
  @IsNotEmpty({message: "O nome de usuário não pode ser vazio"})
  username: string

  @IsNotEmpty({message: "A senha não pode estar vazia"})
  @IsString({message: "A senha deve ser uma string"})
  @MaxLength(128, {message: "A senha está muito longa"})
  @MinLength(8, {message: "A senha deve ter no mínimo 8 caracteres"})
  password: string
}

export class UserLogout { 
  @IsNotEmpty({message: "O token não pode estar vazio"})
  @IsString({message: "O token deve ser uma string"})
  token: string
}

export class UserRefresh extends UserLogout {}