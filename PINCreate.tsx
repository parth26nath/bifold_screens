import { View, Text, TouchableOpacity, Dimensions, Keyboard } from 'react-native'
import React, { useEffect, useLayoutEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { PINInput } from '../components/inputs/PINInput'
import { useAuth } from '../contexts/auth'
import { useConfiguration } from '../contexts/configuration'
import { useStore } from '../contexts/store'
import { useTheme } from '../contexts/theme'
import { BifoldError } from '../types/error'
import { AuthenticateStackParams, Screens } from '../types/navigators'
import { PINCreationValidations, PINValidationsType } from '../utils/PINCreationValidation'
import { testIdWithKey } from '../utils/testable'

interface PINCreateProps extends StackScreenProps<ParamListBase, Screens.CreatePIN> {
  setAuthenticated: (status: boolean) => void
}

interface ModalState {
  visible: boolean
  title: string
  message: string
  onModalDismiss?: () => void
}

const PINCreate: React.FC<PINCreateProps> = ({ setAuthenticated, route }) => {
  const updatePin = (route.params as any)?.updatePin
  const { setPIN: setWalletPIN, checkPIN, rekeyWallet } = useAuth()
  const [PIN, setPIN] = useState('')
  const [PINTwo, setPINTwo] = useState('')
  const [PINOld, setPINOld] = useState('')
  const [continueEnabled, setContinueEnabled] = useState(true)
  const [isLoading, setLoading] = useState(false)
  const [modalState, setModalState] = useState<ModalState>({visible: false,
    title: '',
    message: '',
  })
  const iconSize= 24
  const navigation = useNavigation<StackNavigationProp<AuthenticateStackParams>>()
  const [store, dispatch] = useStore()
  const { t } = useTranslation()
  const { PINSecurity } = useConfiguration()

  const [PINOneValidations, setPINOneValidations] = useState<PINValidationsType[]>(
    PINCreationValidations(PIN, PINSecurity.rules)
  )

  const { ColorPallet, TextTheme } = useTheme()
  const { ButtonLoading } = useAnimatedComponents()
  const PINTwoInputRef = useRef<TextInput>(null)
  const createPINButtonRef = useRef<TouchableOpacity>(null)
  const actionButtonLabel = updatePin ? t('PINCreate.ChangePIN') : t('PINCreate.CreatePIN')
  const actionButtonTestId = updatePin ? testIdWithKey('ChangePIN') : testIdWithKey('CreatePIN')
  const container = useContainer()
  const Button = container.resolve(TOKENS.COMP_BUTTON)

  const screenHeight = Math.round(Dimensions.get('window').height);

  const getFontSizem = () => {
    return screenHeight < 600 ? screenHeight * 0.015 : screenHeight * 0.025;
  };
  const getFontSizel = () => {
    return screenHeight < 600 ? screenHeight * 0.016 : screenHeight * 0.018;
  }

  const handlePress = () => {
    console.log('TouchableOpacity pressed');
    navigation.goBack(); // Verify navigation is defined and working
  };

  useEffect(() => {
    if (updatePin) {
      setContinueEnabled(PIN !== '' && PINTwo !== '' && PINOld !== '')
    }
  }, [PINOld, PIN, PINTwo])

  return (
    <SafeAreaView>
      {!confirm ? <View style={{width: '100%', height: '100%', flex: 1}}>
        <TouchableOpacity
          style={{
            width: 48,
            height: 48,
            backgroundColor: 'white',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 8,
            margin: '8%',
          }}
          onPress={handlePress}
        >
          <Icon name="arrow-left" color="black" size={24} />
        </TouchableOpacity>
        <Text style={{textAlign: 'center', fontWeight: 'bold', fontSize: getFontSizem(), color: 'black'}}>Create PIN</Text>
        <Text style={{textAlign: 'center', color: '#7A7A7A', marginTop: 2, marginBottom: 10}}>{t('PINCreate.PINDisclaimer')}</Text>
        <PINInput
          label={t('PINCreate.EnterPINTitle', { new: updatePin ? t('PINCreate.NewPIN') + ' ' : '' })}
          onPINChanged={(p: string) => {
            setPIN(p)
            setPINOneValidations(PINCreationValidations(p, PINSecurity.rules))

            if (p.length === minPINLength) {
              if (PINTwoInputRef && PINTwoInputRef.current) {
                PINTwoInputRef.current.focus()
                // NOTE:(jl) `findNodeHandle` will be deprecated in React 18.
                // https://reactnative.dev/docs/new-architecture-library-intro#preparing-your-javascript-codebase-for-the-new-react-native-renderer-fabric
                const reactTag = findNodeHandle(PINTwoInputRef.current)
                if (reactTag) {
                  AccessibilityInfo.setAccessibilityFocus(reactTag)
                }
              }
            }
          }}
          testID={testIdWithKey('EnterPIN')}
          accessibilityLabel={t('PINCreate.EnterPIN')}
          autoFocus={false}
        />
        {PINSecurity.displayHelper && (
          <View style={{ marginBottom: 16 }}>
            {PINOneValidations.map((validation, index) => {
              return (
                <View style={{ flexDirection: 'row' }} key={index}>
                  {validation.isInvalid ? (
                    <Icon name="clear" size={iconSize} color={ColorPallet.notification.errorIcon} />
                  ) : (
                    <Icon name="check" size={iconSize} color={ColorPallet.notification.successIcon} />
                  )}
                  <Text style={[TextTheme.normal, { paddingLeft: 4 }]}>
                    {t(`PINCreate.Helper.${validation.errorName}`)}
                  </Text>
                </View>
              )
            })}
          </View>
        )}
      </View> :
        <View style={{width: '100%', height: '100%', flex: 1}}>
          <TouchableOpacity style={{width: 48, height: 48, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', borderRadius: 8, margin: '8%'}} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text style={{textAlign: 'center', fontWeight: 'bold', fontSize: getFontSizem(), color: 'black'}}>Confirm PIN</Text>
          <Text style={{textAlign: 'center', color: '#7A7A7A', marginTop: 2, marginBottom: 10}}>{t('PINCreate.PINDisclaimer')}</Text>
          <PINInput
            label={t('PINCreate.ReenterPIN', { new: updatePin ? t('PINCreate.NewPIN') + ' ' : '' })}
            onPINChanged={(p: string) => {
              setPINTwo(p)
              if (p.length === minPINLength) {
                Keyboard.dismiss()
                if (createPINButtonRef && createPINButtonRef.current) {
                  // NOTE:(jl) `findNodeHandle` will be deprecated in React 18.
                  // https://reactnative.dev/docs/new-architecture-library-intro#preparing-your-javascript-codebase-for-the-new-react-native-renderer-fabric
                  const reactTag = findNodeHandle(createPINButtonRef.current)
                  if (reactTag) {
                    AccessibilityInfo.setAccessibilityFocus(reactTag)
                  }
                }
              }
            }}
            testID={testIdWithKey('ReenterPIN')}
            accessibilityLabel={t('PINCreate.ReenterPIN', { new: updatePin ? t('PINCreate.NewPIN') + ' ' : '' })}
            autoFocus={false}
            ref={PINTwoInputRef}
          />
        </View>
      }


    </SafeAreaView>
  )
}

export default PINCreate