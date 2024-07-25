/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsString, Matches, IsEmail } from 'class-validator';

export class CreateAdminUserDto {
  @IsNotEmpty({ message: 'Please enter name.' })
  @IsString({ message: 'Please enter valid name.' })
  @Matches(/^[a-zA-Z\s]+$/, {
    message: 'Name should not contain numbers or special characters.',
  })
  readonly name: string;

  @IsNotEmpty({ message: 'Please enter email.' })
  @IsEmail({}, { message: 'Please enter valid email.' })
  readonly email_id: string;

  @IsNotEmpty({ message: 'Please enter position.' })
  @IsString({ message: 'Please enter valid name.' })
  @Matches(/^[a-zA-Z\s]+$/, {
    message: 'Position should not contain numbers or special characters.',
  })
  readonly position: string;

  @IsNotEmpty({ message: 'Please select role.' })
  readonly role_ids: string;

  @IsNotEmpty({ message: 'Please select reporting to.' })
  readonly reporting_to: string;
}
