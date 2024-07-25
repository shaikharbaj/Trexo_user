import { Transport } from '@nestjs/microservices';

//Setting up transport
const myTransport: Transport = Transport.KAFKA;

export const SELF_REGISTRY_KAFKA = {
  transport: myTransport,
  options: {
    client: {
      clientId: 'user',
      brokers: [process.env.USER_MICROSERVICE_BROKER],
    },
    consumer: {
      groupId: 'user-consumer-main'
    },
  },
};
