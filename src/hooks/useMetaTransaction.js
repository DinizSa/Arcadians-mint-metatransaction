import { useState } from "react";
import useBiconomyContext from "./useBiconomyContext";

const useMetaTransaction = ({ transactionParams }) => {
  const { contract } = useBiconomyContext();
  const [isMetatransactionProcessing, setIsMetatransactionProcessing] =
    useState(false);
  const [error, setError] = useState();

  const onSubmitMetaTransaction = ({ onConfirmation, onError }) => {
    try {
      setIsMetatransactionProcessing(true);
      const tx = contract.methods.mint(transactionParams.from).send(transactionParams);

      tx.on("transactionHash", function () {})
        .once("confirmation", function (transactionHash) {
          setIsMetatransactionProcessing(false);
          onConfirmation(transactionHash);
        })
        .on("error", function () {
          setIsMetatransactionProcessing(false);
          onError();
        });
    } catch (e) {
      setError(e);
      onError();
    }
  };

  return { error, isMetatransactionProcessing, onSubmitMetaTransaction };
};

export default useMetaTransaction;
