import { Get, Router } from 'kenai';


@Router()
export default class MainRouter {
    @Get('/health-check')
    public healthCheck() {
        return { message: 'OK' };
    }
}
