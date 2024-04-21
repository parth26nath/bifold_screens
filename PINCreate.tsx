import { ParamListBase, useNavigation, useRoute } from '@react-navigation/core'
import { CommonActions } from '@react-navigation/native'
import { StackNavigationProp, StackScreenProps } from '@react-navigation/stack'
import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AccessibilityInfo,
  Keyboard,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  findNodeHandle,
  DeviceEventEmitter,
} from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons'

// eslint-disable-next-line import/no-named-as-default
import { ButtonType } from '../components/buttons/Button-api'
import PINInput from '../components/inputs/PINInput'
import AlertModal from '../components/modals/AlertModal'
import KeyboardView from '../components/views/KeyboardView'
import { EventTypes, minPINLength } from '../constants'
import { TOKENS, useContainer } from '../container-api'
import { useAuth } from '../contexts/auth'
import { useAnimatedComponents } from '../contexts/animated-components'
import { useConfiguration } from '../contexts/configuration'
import { DispatchAction } from '../contexts/reducers/store'
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

const CreatePinComponent: React.FC = () => {
  const [confirm, setConfirm] = useState(false);
  const screenHeight = Math.round(Dimensions.get('window').height);
  const getFontSizem = () => {
    return screenHeight < 600 ? screenHeight * 0.015 : screenHeight * 0.025;
  };
  const getFontSizel = () => {
    return screenHeight < 600 ? screenHeight * 0.016 : screenHeight * 0.018;
  }

  return (
    <View className="w-full h-full flex">
      {!confirm ? <View className="w-full h-full flex">
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
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" color="black" size={24} />
        </TouchableOpacity>
        <Text className={`text-bold font-semibold text-center text-black`} style={{ fontSize: getFontSizem() }}>Create PIN</Text>
        <Text className="text-center text-grey3 mt-[2%] mb-[10%]" style={{ fontSize: getFontSizel() }}>Choose a new pin for authentication</Text>
        <PinDots confirm1={confirm} confirm={setConfirm} />
      </View> :
        <View className="w-full h-full flex">
          <TouchableOpacity className="w-12 h-12 bg-white flex justify-center items-center rounded-md  m-[8%]">
            <Icon name="arrow-left" size={24} color="black"onPress={() => navigation.goBack()} />
          </TouchableOpacity>
          <Text className={`text-bold  font-semibold text-center text-black`} style={{ fontSize: getFontSizem() }}>Confirm PIN</Text>
          <Text className="text-center text-grey3  mt-[2%] mb-[10%]" style={{ fontSize: getFontSizel() }}>Confirm  pin for authentication</Text>
          <PinDots confirm1={confirm} confirm={setConfirm} />
        </View>
      }
    </View>
  )
}

const PINCreate: React.FC<PINCreateProps> = ({ setAuthenticated, route }) => {
  const updatePin = (route.params as any)?.updatePin
  const { setPIN: setWalletPIN, checkPIN, rekeyWallet } = useAuth()
  const [PIN, setPIN] = useState('')
  const [PINTwo, setPINTwo] = useState('')
  const [PINOld, setPINOld] = useState('')
  const [continueEnabled, setContinueEnabled] = useState(true)
  const [isLoading, setLoading] = useState(false)
  const [modalState, setModalState] = useState<ModalState>({
    visible: false,
    title: '',
    message: '',
  })
  const iconSize = 24
  const navigation = useNavigation<StackNavigationProp<AuthenticateStackParams>>()
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

  const style = StyleSheet.create({
    screenContainer: {
      height: '100%',
      backgroundColor: ColorPallet.brand.primaryBackground,
      padding: 20,
      justifyContent: 'space-between',
    },

    // below used as helpful labels for views, no properties needed atp
    contentContainer: {},
    controlsContainer: {},
  })

  const passcodeCreate = async (PIN: string) => {
    try {
      setContinueEnabled(false)
      await setWalletPIN(PIN)
      // This will trigger initAgent
      setAuthenticated(true)

      dispatch({
        type: DispatchAction.DID_CREATE_PIN,
      })
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: Screens.UseBiometry }],
        })
      )
    } catch (err: unknown) {
      const error = new BifoldError(t('Error.Title1040'), t('Error.Message1040'), (err as Error)?.message ?? err, 1040)
      DeviceEventEmitter.emit(EventTypes.ERROR_ADDED, error)
    }
  }

  const validatePINEntry = (PINOne: string, PINTwo: string): boolean => {
    for (const validation of PINOneValidations) {
      if (validation.isInvalid) {
        setModalState({
          visible: true,
          title: t('PINCreate.InvalidPIN'),
          message: t(`PINCreate.Message.${validation.errorName}`),
        })
        return false
      }
    }
    if (PINOne !== PINTwo) {
      setModalState({
        visible: true,
        title: t('PINCreate.InvalidPIN'),
        message: t('PINCreate.PINsDoNotMatch'),
      })
      return false
    }
    return true
  }

  const checkOldPIN = async (PIN: string): Promise<boolean> => {
    const valid = await checkPIN(PIN)
    if (!valid) {
      setModalState({
        visible: true,
        title: t('PINCreate.InvalidPIN'),
        message: t(`PINCreate.Message.OldPINIncorrect`),
      })
    }
    return valid
  }

  const confirmEntry = async (PINOne: string, PINTwo: string) => {
    if (!validatePINEntry(PINOne, PINTwo)) {
      return
    }

    await passcodeCreate(PINOne)
  }
  useEffect(() => {
    if (updatePin) {
      setContinueEnabled(PIN !== '' && PINTwo !== '' && PINOld !== '')
    }
  }, [PINOld, PIN, PINTwo])

  return (
    <KeyboardView>
      <View style={style.screenContainer}>
        <View style={style.contentContainer}>
          <Text style={[TextTheme.normal, { marginBottom: 16 }]}>
            <Text style={{ fontWeight: TextTheme.bold.fontWeight }}>
              {updatePin ? t('PINCreate.RememberChangePIN') : t('PINCreate.RememberPIN')}
            </Text>{' '}
            {t('PINCreate.PINDisclaimer')}
          </Text>
          {updatePin && (
            <PINInput
              label={t('PINCreate.EnterOldPINTitle')}
              testID={testIdWithKey('EnterOldPIN')}
              onPINChanged={(p: string) => {
                setPINOld(p)
              }}
            />
          )}
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
          {modalState.visible && (
            <AlertModal
              title={modalState.title}
              message={modalState.message}
              submit={() => {
                if (modalState.onModalDismiss) {
                  modalState.onModalDismiss()
                }
                setModalState({ ...modalState, visible: false, onModalDismiss: undefined })
              }}
            />
          )}
        </View>
        <View style={style.controlsContainer}>
          <Button
            title={actionButtonLabel}
            testID={actionButtonTestId}
            accessibilityLabel={actionButtonLabel}
            buttonType={ButtonType.Primary}
            disabled={!continueEnabled || PIN.length < minPINLength || PINTwo.length < minPINLength}
            onPress={async () => {
              setLoading(true)
              if (updatePin) {
                const valid = validatePINEntry(PIN, PINTwo)
                if (valid) {
                  setContinueEnabled(false)
                  const oldPinValid = await checkOldPIN(PINOld)
                  if (oldPinValid) {
                    const success = await rekeyWallet(PINOld, PIN, store.preferences.useBiometry)
                    if (success) {
                      setModalState({
                        visible: true,
                        title: t('PINCreate.PinChangeSuccessTitle'),
                        message: t('PINCreate.PinChangeSuccessMessage'),
                        onModalDismiss: ()=> {
                          navigation.navigate(Screens.Settings as never)
                        },
                      })
                    }
                  }
                  setContinueEnabled(true)
                }
              } else {
                await confirmEntry(PIN, PINTwo)
              }
              setLoading(false)
            }}
            ref={createPINButtonRef}
          >
            {!continueEnabled && isLoading ? <ButtonLoading /> : null}
          </Button>
        </View>
      </View>
    </KeyboardView>
  )
}

const CreatePinScreen: React.FC = () => {
  const navigation = useNavigation()
  const route = useRoute()

  return (
    <CreatePinComponent
      navigation={navigation}
      route={route}
    />
  )
}

export default CreatePinScreen