import { useEffect, useState } from "react";
import "./App.css";
import { UniPassPopupSDK } from "@unipasswallet/popup-sdk";
import {
  UniPassTheme,
  UPEventType,
  UPAccount,
  ConnectType,
} from "@unipasswallet/popup-types";
import { parseEther } from "ethers/lib/utils";

const upWallet = new UniPassPopupSDK({
  env: "test",
  // for polygon mumbai
  chainType: "polygon",
  // choose localStorage if you want to cache user account permanent
  storageType: "sessionStorage",
  appSettings: {
    theme: UniPassTheme.DARK,
    appName: "UniPass Wallet Demo",
    appIcon: "",
  },
});

function App() {
  const [account, setAccount] = useState<UPAccount | null>(null);
  const [destinationAddress, setDestinationAddress] = useState("");
  const [txHash, setTxHash] = useState("");

  const checkTxStatus = async (txHash: string) => {
    let tryTimes = 0;
    while (tryTimes++ < 3) {
      const receipt = await upWallet
        .getProvider()
        .getTransactionReceipt(txHash);
      if (receipt) return receipt.status;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    return false;
  };

  const sendNativeToken = async () => {
    if (!account) {
      throw new Error("Not connected");
    }

    try {
      const tx = {
        from: account.address,
        to: destinationAddress,
        value: parseEther("0.000001").toHexString(),
        data: "0x",
      };
      const hash = await upWallet.sendTransaction(tx);
      setTxHash(hash);

      if (await checkTxStatus(txHash)) {
        console.log("send Native Token success", txHash);
      } else {
        console.error(`send Native Token failed, tx hash = ${txHash}`);
      }
    } catch (err) {
      console.log("err", err);
    }
  };

  useEffect(() => {
    const _account = upWallet.getAccount();

    if (_account) {
      setAccount(_account);
    }
  }, []);

  return (
    <div className="App">
      {account && (
        <div>
          <h3>Address: {account.address}</h3>
          <h3>Email: {account.email}</h3>
          <h3>Signature: {account.signature}</h3>
        </div>
      )}

      {!account ? (
        <button
          onClick={async () => {
            try {
              const account = await upWallet.login({
                email: true,
                eventListener: (event: any) => {
                  console.log("event", event);
                  const { type, body } = event;
                  if (type === UPEventType.REGISTER) {
                    console.log("account", body);
                    alert("a user register");
                  }
                },
                connectType: "google",
              });
              const { address, email } = account;

              setAccount(account);
              console.log("account", address, email);
            } catch (err) {
              console.log("connect err", err);
            }
          }}
        >
          Connect
        </button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={() => {
              upWallet.logout(true).then(() => {
                setAccount(null);
              });
            }}
          >
            Logout
          </button>
          Destination{" "}
          <input
            value={destinationAddress}
            onChange={(e) => {
              setDestinationAddress(e.target.value);
            }}
          />
          <button onClick={() => sendNativeToken()}>
            Send 0.000001 native token
          </button>
          {txHash?.length > 0 && <h3>TX hash: {txHash}</h3>}
        </div>
      )}
    </div>
  );
}

export default App;
