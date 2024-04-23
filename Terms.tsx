import { View, Text, Image, TouchableOpacity, Dimensions, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { amico1 } from '../../assets'
import { amico2 } from '../../assets'
import { useNavigation } from '@react-navigation/native'
import { FONT_STYLE_1, FONT_STYLE_2, BUTTON_STYLE1, BUTTON_STYLE2 } from '../../constants/fonts'
import ServiceHeadings from '../../components/Onboarding/ServiceHeadings'
import { AriesWallet } from "@aries-framework/react-native";
import Amico11 from '../../assets/icons/amico11.svg';
import Amico12 from '../../assets/icons/amico12.svg';
import Amico13 from '../../assets/icons/amico13.svg';
import { useTranslation } from 'react-i18next'

interface TermsVersionProps {
  TermsVersion: boolean
}

const LandingPage: React.FC<TermsVersionProps> = ({ TermsVersion }) => {
  const navigation = useNavigation();
  const screenHeight = Math.round(Dimensions.get('window').height);
  const imageComponents = [Amico11, Amico12, Amico13];
  const screenWidth = Math.round(Dimensions.get('window').width);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [walletInitialized, setWalletInitialized] = useState(false);
  const [networkConnected, setNetworkConnected] = useState(false);
  const { t } = useTranslation()

  const initializeWallet = async () => {
    try {
      const wallet = new AriesWallet();
      console.log("Wallet is: ", wallet)
      await wallet.initialize();
      setWalletInitialized(true);
      console.log("function called")
    } catch (error) {
      console.log("Error", "Failed to initialize the wallet.", error);
    }
  };

  const connectToNetwork = async () => {
    try {
      // Connect to the desired network
      // Add network connection logic here
      setNetworkConnected(true);
    } catch (error) {
      Alert.alert("Error", "Failed to connect to the network.");
    }
  };

  const styles = StyleSheet.create({
    border: {
      borderColor: '#5869E6',
      borderWidth: 1,
    },
    container: {
      position: 'absolute',
      top: screenHeight < 600 ? '5%' : '12%',
      left: screenHeight < 600 ? '10%' : '15%',
      width: screenHeight < 600 ? '70%' : '',
    },
  });

  const getFontSizeh = () => {
    return screenHeight < 600 ? screenHeight * 0.015 : screenHeight * 0.025;
  };
  const getFontSize = () => {
    return screenHeight < 600 ? screenHeight * 0.015 : screenHeight * 0.017;
  };
  const getSpace = () => {
    return screenHeight < 600 ? screenHeight * 0.015 : screenHeight * 0.08;
  }

  const onAcceptPressed = () => {
    if (TermsVersion) {
      initializeWallet();
      connectToNetwork();
      navigation.navigate("CreatePin");
    }
  };

  useEffect(() => {
    console.log(screenHeight)
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % imageComponents.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <View style={[styles.border, { height: '40%', backgroundColor: 'primary', borderRadius: screenWidth * 0.04, opacity: 0.2 }]} />

        {React.createElement(imageComponents[currentImageIndex], { style: styles.container })}

        <View style={{ width: '90%', marginHorizontal: '5%', height: '43%', paddingTop: '20%', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Text style={{ ...FONT_STYLE_2, fontSize: getFontSizeh(), color: 'black' }}>My Identity, My Wallet</Text>
          <ServiceHeadings />
          <Text style={{ ...FONT_STYLE_2, fontSize: getFontSize(), marginTop: getSpace() }}>
            By clicking, I accept the <Text style={{ color: 'primary' }}>terms of service</Text> and <Text style={{ color: 'primary' }}>privacy policy</Text>.
          </Text>
          <TouchableOpacity
            style={{ ...BUTTON_STYLE1, backgroundColor: 'primary', borderRadius: screenWidth * 0.02, borderWidth: 1, borderColor: 'primary', paddingHorizontal: '6%', paddingVertical: '3%', marginTop: '5%', alignItems: 'center', justifyContent: 'center' }}
            onPress={onAcceptPressed}
          >
            <Text style={{ ...FONT_STYLE_1, fontSize: getFontSize(), color: 'primary' }}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default LandingPage
