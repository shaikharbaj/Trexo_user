import { UserType } from "@prisma/client";
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  Length,
  Matches,
  Validate,
  ValidationArguments,
  ValidatorConstraintInterface,
  ValidatorConstraint,
  IsOptional,
} from "class-validator";

@ValidatorConstraint({ name: "isPasswordMatch", async: false })
class IsPasswordMatchConstraint implements ValidatorConstraintInterface {
  validate(confirmPassword: string, args: ValidationArguments) {
    const object = args.object as CreateBuyerDto;
    return object.password === confirmPassword;
  }

  defaultMessage(args: ValidationArguments) {
    return "_password_and_confirm_password_not_match";
  }
}

export class CreateBuyerDto {
  @IsNotEmpty({ message: "_please_enter_first_name" })
  @IsString({ message: "_first_name_must_be_string" })
  readonly first_name: string;

  @IsNotEmpty({ message: "_please_enter_middle_name" })
  @IsString({ message: "_middle_name_must_be_string" })
  readonly middle_name: string;

  @IsNotEmpty({ message: "_please_enter_last_name" })
  @IsString({ message: "_last_name_must_be_string" })
  readonly last_name: string;

  @IsNotEmpty({ message: "_please_enter_email" })
  @IsEmail({}, { message: "_email_must_be_valid_email_address" })
  readonly email_id: string;

  @IsNotEmpty({ message: "_please_enter_mobile_number" })
  // @IsString({ message: "Mobile number must be a string." })
  readonly mobile_number: string;

  @IsNotEmpty({ message: "_please_enter_pan_card_number" })
  @IsString({ message: "_pan_card_number_must_string" })
  readonly pan_card_number: string;

  @IsNotEmpty({ message: "_please_enter_aadhar_card_number" })
  @Matches(/^\d{12}$/, {
    message: "_aadhar_card_number_must_be_12_digit_number",
  })
  readonly aadhar_card_number: string;

  @IsOptional()
  @IsEnum(UserType, { message: "_usertype_must_be_buyer" })
  readonly user_type: UserType = UserType.BUYER;

  @IsNotEmpty({ message: "_please_enter_password" })
  @Length(8, 100, { message: "_password_must_be_at_least_8_character" })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        "_contain_at_least_one_upparcase_lowercase_number_special_chatacter",
    }
  )
  readonly password: string;

  @IsNotEmpty({ message: "_please_enter_confirm_password" })
  @IsString({ message: "_confirm_password_must_be_string" })
  @Validate(IsPasswordMatchConstraint)
  readonly confirmPassword: string;
}
