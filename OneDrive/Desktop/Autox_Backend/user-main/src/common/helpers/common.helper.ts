import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";

@Injectable()
export class CommonHelper {
  /**
   * @description
   * Function to pluck particular key from array of object
   */
  public recursivePluck(data: any, keyToPluck: string): Array<string> {
    let result = [];
    function recursive(obj: any) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (typeof obj[key] === "object") {
            // If the current property is an object, recursively call the function
            recursive(obj[key]);
          } else if (key === keyToPluck) {
            // If the key matches, add its value to the result array
            result.push(obj[key]);
          }
        }
      }
    }
    // Start the recursive process
    data.forEach((d: any) => {
      recursive(d);
    });
    return result;
  }

  /**
   * @description
   * Function to pluck particular key from array of object
   */
  public pluck(
    data: any,
    keyToPluck: string,
    stringArray: boolean = false
  ): Array<string> {
    // Use map to extract the specified key from each object
    const pluckedData = data.map((obj: any) => {
      if (stringArray === true) {
        return obj[keyToPluck].toString();
      } else {
        return obj[keyToPluck];
      }
    });
    return pluckedData;
  }

  /**
   * @description
   * Function to convert array of objects to key value pair object
   */
  public arrayToKeyValueObject(array: any, valueKey: string) {
    const resultObject = array.reduce((acc: any, obj: any) => {
      acc[obj[valueKey]] = obj;
      return acc;
    }, {});
    return resultObject;
  }

  /**
   * @description
   * Function to encode password
   */
  async encodePassword(password: string) {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
  }

  /**
   * @description
   * Function to generate unique id
   */
  generateUniqueId(alias: string, serialNumber: number) {
    const paddedNumber = String(serialNumber).padStart(5, "0");
    return `${alias}-${paddedNumber}`;
  }

  /**
   * @description
   * Function to generate random otp
   */
  public generateRandomOtp(): number {
    return Math.floor(1000 + Math.random() * 9000);
  }
}
