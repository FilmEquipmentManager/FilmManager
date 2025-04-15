interface FirebaseErrorDecoderProps {
    error: string;
}

function FirebaseErrorDecoder({ error }: FirebaseErrorDecoderProps) {
    const decodeError = (errorMsg: string): string => {
        try {
            const prefix = "Firebase: Error (";
            const suffix = ")";
            const startIndex = errorMsg.indexOf(prefix);
            const endIndex = errorMsg.lastIndexOf(suffix);

            if (!(startIndex === -1 || endIndex === -1 || endIndex <= startIndex)) {
				const extracted = errorMsg.substring(
					startIndex + prefix.length,
					endIndex
				);
	
				const withoutAuth = extracted.replace("auth/", "");
	
				const withSpaces = withoutAuth.replace(/-/g, " ");
	
				const result =
					withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
	
				return result;
            } else {
				return errorMsg;
			}
        } catch {
            return errorMsg;
        }
    };

    return decodeError(error);
}

export default FirebaseErrorDecoder;