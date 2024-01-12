import dotenv from "dotenv"
import { getAccountNonce } from "permissionless"
import { UserOperation, bundlerActions, getSenderAddress, getUserOperationHash, waitForUserOperationReceipt, GetUserOperationReceiptReturnType, signUserOperationHashWithECDSA } from "permissionless"
import { pimlicoBundlerActions, pimlicoPaymasterActions } from "permissionless/actions/pimlico"
import { Address, Hash, concat, createClient, createPublicClient, encodeFunctionData, http, Hex } from "viem"
import { generatePrivateKey, privateKeyToAccount, signMessage } from "viem/accounts"
import { lineaTestnet, polygonMumbai } from "viem/chains"

console.log("Hello world!")

// CREATE THE CLIENTS
const publicClient = createPublicClient({
  transport: http("https://rpc.goerli.linea.build/"),
  chain: lineaTestnet
})

const chain = "linea-testnet" // find the list of chain names on the Pimlico verifying paymaster reference page
const apiKey = "9e9c590c-c6b2-4767-b8aa-12be5a362aba" // REPLACE THIS

const bundlerClient = createClient({
  transport: http(`https://api.pimlico.io/v1/${chain}/rpc?apikey=${apiKey}`),
  chain: lineaTestnet
}).extend(bundlerActions).extend(pimlicoBundlerActions)

const paymasterClient = createClient({
  // ⚠️ using v2 of the API ⚠️
  transport: http(`https://api.pimlico.io/v2/${chain}/rpc?apikey=${apiKey}`),
  chain: lineaTestnet
}).extend(pimlicoPaymasterActions)



// GENERATE THE INITCODE
const SIMPLE_ACCOUNT_FACTORY_ADDRESS = "0x9406Cc6185a346906296840746125a0E44976454"

const ownerPrivateKey = generatePrivateKey()
const owner = privateKeyToAccount(ownerPrivateKey)

console.log("Generated wallet with private key:", ownerPrivateKey)

const initCode = concat([
  SIMPLE_ACCOUNT_FACTORY_ADDRESS,
  encodeFunctionData({
    abi: [{
      inputs: [{ name: "owner", type: "address" }, { name: "salt", type: "uint256" }],
      name: "createAccount",
      outputs: [{ name: "ret", type: "address" }],
      stateMutability: "nonpayable",
      type: "function",
    }],
    args: [owner.address, 0n]
  })
]);

console.log("Generated initCode:", initCode)


// CALCULATE THE SENDER ADDRESS
const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"

const senderAddress = await getSenderAddress(publicClient, {
  initCode,
  entryPoint: ENTRY_POINT_ADDRESS
})
console.log("Calculated sender address:", senderAddress)
