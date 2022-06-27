/* eslint-disable react-hooks/exhaustive-deps */
import {
  Card,
  Typography,
  Skeleton,
  Button,
  notification,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import yourCollectibleContract from "contracts/YourCollectible.json";
import Address from "components/Address/Address";
import { useMoralis, useChain } from "react-moralis";
import yourCollectible from "list/yourCollectible.json";
import { useAPIContract } from "hooks/useAPIContract";
import useBiconomyContext from "hooks/useBiconomyContext";
import useMetaTransaction from "hooks/useMetaTransaction";

import axios from "axios"

export default function Contract() {
  const { isInitialized, isWeb3Enabled, account } = useMoralis();
  const { chainId } = useChain();
  const { isBiconomyInitialized, biconomyProvider } = useBiconomyContext();
  const { contractName, abi } = yourCollectibleContract;
  const [isClaimMode, setClaimMode] = useState(false);
  const [tokensBalance, setTokensBalance] = useState(0);
  const [tokens, setTokens] = useState([]); // tokens: {id, URI, metadata}
  const contractAddress = useMemo(() => yourCollectible[chainId], [chainId]);

  /**
   * @description For getting storage data from smart contracts (params defined below);
   */
  const { runContractFunction, isLoading } = useAPIContract();

  /**
   * @description For executing meta transaction
   *
   * @param {String} input - New storage data
   * @param {Address} transactionParams.from - address that will sign the metatransaction
   */
  const { isMetatransactionProcessing, onSubmitMetaTransaction } =
    useMetaTransaction({
      transactionParams: {
        from: account,
        signatureType: "EIP712_SIGN", // Signature options: PERSONAL_SIGN | EIP712_SIGN
      },
    });
  
  /**
   * @description Execute a function in the smart contract
   *
   * @param {Function} onSuccess - success callback function
   * @param {Function} onError - error callback function
   * @param {Function} onComplete -complete callback function
   */
   const onContractCall = ({ methodName, methodParams, onSuccess, onError }) => {
    runContractFunction({
      params: {
        chain: chainId,
        function_name: methodName,
        abi,
        address: contractAddress,
        params: methodParams
      },
      onSuccess,
      onError
    });
  };

  /**
   * @description Execute `getTokensBalance` call from smart contract
   * Input parameters described in `onContractCall`
   */
  const getTokensBalance = ({ onSuccess, onError }) => {
    let methodParams = {owner:  account};
    onContractCall({methodName: "balanceOf", methodParams, onSuccess, onError})
  };

  /**
   * @description Execute `tokenOfOwnerByIndex` call from smart contract
   * Input parameters described in `onContractCall`
   */
   const getTokenOfOwnerByIndex = ({ tokenIndex, onSuccess, onError }) => {
    let methodParams = {owner:  account, index: tokenIndex};
    onContractCall({methodName: "tokenOfOwnerByIndex", methodParams: methodParams, onSuccess, onError})
  };

  /**
   * @description Execute `getTokensBalance` call from smart contract
   * Input parameters described in `onContractCall`
   */
   const getTokenURI = ({ tokenId, onSuccess, onError }) => {
    let methodParams = {tokenId: tokenId};
    onContractCall({methodName: "tokenURI", methodParams: methodParams, onSuccess, onError})
  };

  /**
   * @description if `isClaimMode` is true, execute meta transaction,
   * otherwise set `isClaimMode` to true
   *
   * @param {*} e
   */
  const onSubmit = async (e) => {
    await e.preventDefault();
    if (isClaimMode) {
      onSubmitMetaTransaction({
        onConfirmation: () => {
          setClaimMode(false);
          getTokensBalance({
            onSuccess: () => {
              notification.success({
                message: "Metatransaction Successful",
                description: `You metatransaction has been successfully executed!`,
              });
            },
          });
        },
        onError: () => {
          notification.error({
            message: "Metatransaction Fail",
            description:
              "Your metatransaction has failed. Please try again later.",
          });
        },
      });
    } else {
      setClaimMode(true);
    }
  };

  useEffect(() => {
    /**
     * Running when one of the following conditions fulfilled:
     * - Moralis SDK is Initialized
     * - Web3 has been enabled
     * - Connected Chain Changed
     */
    if (isInitialized && isWeb3Enabled) {
      getTokensBalance({
        onSuccess: (balance) => {
          // Reinitialize everything
          setClaimMode(false);
          setTokensBalance(balance)
        },
      });
    }
  }, [isInitialized, isWeb3Enabled, contractAddress, abi, chainId]);

  useEffect(async () => {
    console.log("tokensBalance updated: ", tokensBalance);
    if (isInitialized && isWeb3Enabled && tokensBalance > 0) {
      fetchTokens();
    }
  }, [tokensBalance]);

  async function fetchTokens() {
    for (let i = 0; i < tokensBalance; i++) {
      await getTokenOfOwnerByIndex({
        tokenIndex: String(i),
        onSuccess: (tokenId) => {
          if (!isTokenStored(tokenId)) {
            getTokenURI({
              tokenId: String(tokenId),
              onSuccess: (tokenURI) => {
                axios.get(tokenURI).then((resp)=>{
                  let tokenMetadata = resp.data
                  setTokens(oldData => [...oldData, {id: tokenId, URI: tokenURI, metadata: tokenMetadata}])
                })
              },
              onError: () => {
                notification.error({
                  message: "Fetch of tokens failed",
                  description:
                    "There was an error fetching information about your tokens. Please try again later.",
                });
              },
            })
          }
        },
        onError: () => {
          notification.error({
            message: "Fetch of tokens failed",
            description:
              "There was an error fetching your tokens. Please try again later.",
          });
        },
      })
    }
  }

  function isTokenStored(tokenId) {
    for (const token of tokens) {
      if (tokenId == token.id) {
        return true;
      }
    }
    return false;
  }

  return (
    <span>
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "2rem",
        padding: "2rem",
      }}>
        <Typography.Title style={{ margin: 0 }}>
          {process.env.REACT_APP_COLLECTION_NAME} collection
        </Typography.Title>
      </div>

      <Card
        size="large"
        style={{
          minWidth: "60vw",
          boxShadow: "0 0.5rem 1.2rem rgb(189 197 209 / 20%)",
          border: "1px solid #e7eaf3",
          borderRadius: "0.5rem",
          textAlign: "center",
        }}
      >
        <form onSubmit={onSubmit}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: "2rem",
              padding: "2rem",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Typography.Title style={{ margin: 0, fontSize: "23px" }}>
                { isClaimMode ? "Mint an arcadian for free" : "Your tokens"}
              </Typography.Title>
              <Address copyable address={contractAddress} size={8} />
            </div>
            {!tokensBalance > 0 ? (
              <Skeleton />
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                  maxWidth: "280px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                  }}
                >
                  {!isClaimMode ? (
                    <>
                      <Typography.Text style={{ fontSize: "25px" }}>
                        Balance: {tokensBalance}
                      </Typography.Text>
                      <Typography.Text style={{ fontSize: "25px" }}>
                        Tokens id's: {tokens.map((token, index)=> index < tokens.length-1 ? token.id + ", " : token.id)}
                      </Typography.Text>

                      <div style={{
                        display: "flex",
                        flexWrap: "wrap",
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center",
                      }}>
                        {tokens.map((token)=>{
                          return <img style={{
                            display: "inline-flex",
                            padding: "0.5%",
                            width:"49%",
                            height: "auto"
                          }} 
                          src={token.metadata.image}/>
                        })}
                      </div>
                      
                    </>
                  ) : (
                      null
                  )}
                </div>
              </div>
            )}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: "1rem",
                width: "100%",
              }}
            >
              {isClaimMode && (
                <Button
                  
                  size="large"
                  shape="round"
                  style={{ width: "100%", maxWidth: "280px" }}
                  disabled={
                    isBiconomyInitialized &&
                    (isLoading || isMetatransactionProcessing)
                  }
                  onClick={() => {
                    setClaimMode(false);
                  }}
                >
                  See my tokens
                </Button>
              )}
              <Button
                type="primary"
                shape="round"
                size="large"
                htmlType={isClaimMode && "submit"}
                loading={
                  isBiconomyInitialized &&
                  (isLoading || isMetatransactionProcessing)
                }
                style={{ width: "100%", maxWidth: "280px" }}
              >
                {isClaimMode ? "Mint" : "Main page"}
              </Button>
              {!isBiconomyInitialized && (
                <Typography.Text>Loading dApp...</Typography.Text>
              )}
            </div>
          </div>
        </form>
      </Card>
    </span>
  );
}
