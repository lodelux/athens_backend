import {ethers} from "ethers";
import * as dotenv from "dotenv";
import * as WWT_ABI from "./abi/WWT.json";


export default class BlockchainHandler {
    public provider: ethers.JsonRpcProvider;
    public admin_signer: ethers.Wallet
    public WWT
    public blockExplorerBaseURL = "https://sepolia.etherscan.io/tx/";

    constructor() {
        dotenv.config();
        this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        this.admin_signer = new ethers.Wallet(process.env.ADMIN_PK, this.provider);
        this.WWT = new ethers.Contract(process.env.WWT_ADDRESS, WWT_ABI, this.admin_signer);
    }

    public async getBalance(address: string): Promise<string> {
        return await this.WWT.balanceOf(address);
    }

    public async mint(address: string, amount) {

        //parse from number to ether format
        return this.WWT.mint(address, ethers.parseEther(amount.toString()));
    }
}
