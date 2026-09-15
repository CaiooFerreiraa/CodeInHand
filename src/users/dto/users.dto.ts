import { OmitType, PartialType } from '@nestjs/mapped-types'
import { IsNumber, IsString, MaxLength, MinLength } from 'class-validator'

export class UserDataDto {
  @IsNumber({}, {message: "O id deve ser um número"})
  uid: number

  @IsString({message: "A senha deve ser uma string"})
  @MinLength(8, {message: "A senha deve ter no mínimo 8 caracteres"})
  @MaxLength(100)
  password: string

  @IsString({message: "O username deve ser uma string"})
  @MinLength(3, {message: "O username deve ter no mínimo 3 caracteres"})
  @MaxLength(100)
  name: string
}

export class InsertDataUserDto extends OmitType(UserDataDto, ['uid'] as const) {
  
}