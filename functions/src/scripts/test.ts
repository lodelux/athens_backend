import BlockchainHandler from "../blockchainHandler";


const main = async () => {
    const handler = new BlockchainHandler();
    console.log(await handler.getBalance(await  handler.admin_signer.getAddress()));
    await handler.mint(await handler.admin_signer.getAddress(), '10000');
    console.log(await handler.getBalance(await  handler.admin_signer.getAddress()));
}


main()
