import {ethers} from "ethers";
import * as dotenv from "dotenv";
import * as WWT_ABI from "./abi/WWT.json";


export default class BlockchainHandler {
    public provider: ethers.JsonRpcProvider;
    public admin_signer: ethers.Wallet
    public WWT

    constructor() {
        dotenv.config();
        this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        this.admin_signer = new ethers.Wallet(process.env.ADMIN_PK, this.provider);
        this.WWT = new ethers.Contract(process.env.WWT_ADDRESS, WWT_ABI, this.admin_signer);
    }

    public async getBalance(address: string): Promise<string> {
        return await this.WWT.balanceOf(address);
    }

    public async mint(address: string, amount: string): Promise<void> {
        await this.WWT.mint(address, amount);
    }
}
