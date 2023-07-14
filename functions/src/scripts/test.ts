import BlockchainHandler from "../blockchainHandler";


const main = async () => {
    const handler = new BlockchainHandler();
    console.log(await handler.getBalance(await  handler.admin_signer.getAddress()));
    const tx = await handler.mint(await handler.admin_signer.getAddress(), '1');
    console.log(tx.hash);
    console.log(await handler.getBalance(await  handler.admin_signer.getAddress()));
}


main()
