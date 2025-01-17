import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Platform, View, FlatList, ListRenderItem, Text } from "react-native";
import styled from "styled-components/native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import moment from "moment";
import { ActivityIndicator, Card, RadioButton } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../../common/pageHeader";
import {
  SubmitPressableText,
  SubmitPressable,
  IconContainer,
  shadowStyles,
  PaddingView,
} from "../../common/styled";
import Colors from "../../constants/Colors";
import { RootStackScreenProps } from "../../types";
import WebPicker from "./webPicker";
import { createRequest, fetchEmployees } from "../../services/api";
import ConfirmationDialog from "../../common/confirmationDialog";
import setGlobalNotification from "../../actions/globalNotificationActions";

function NewRequest({
  navigation,
}: RootStackScreenProps<"NewRequest">): JSX.Element {
  const [openStart, setOpenStart] = useState(false);
  const [timestamp, setTimestamp] = useState(
    new Date(new Date("September 2, 2022 00:00:00")).getTime()
  );
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee>();
  const [selectedShift, setSelectedShift] = useState<Shift>("MANHA");
  const [loading, setLoading] = useState(false);
  const [waitingResponse, setWaitingResponse] = useState(false);
  const dispatch = useDispatch();

  const { loggedUser } = useSelector(
    (state: { loggedUser: UserObject }) => state
  );

  useEffect(() => {
    // const { data } = await fetchEmployees();
    setLoading(true);
    setEmployees([]);
    fetchEmployees().then((res) => {
      setLoading(false);
      setEmployees(
        res.data.filter((employee) => employee.turnoPrincipal === selectedShift)
      );
    });
  }, [selectedShift]);

  function handleNewRequest(): void {
    setWaitingResponse(true);
    createRequest({
      dataDaTroca: moment(timestamp).format("YYYY-MM-DD"),
      idFuncionarioSolicitado: Number(selectedEmployee?.id),
      idFuncionarioSolicitante: loggedUser.id || 1,
      turnoDaTroca: selectedShift,
    })
      .then(() => {
        setWaitingResponse(false);
        setGlobalNotification(dispatch, `Pedido criado`, "success");
        setSelectedEmployee(undefined);
      })
      .catch((err) => {
        setWaitingResponse(false);
        setGlobalNotification(dispatch, err.message, "error");
        setSelectedEmployee(undefined);
      });
    console.log("submit pedido de troca para", selectedEmployee);
  }

  // precisa ter um request de usuários

  const renderItem: ListRenderItem<Employee> = ({ item }) => (
    <Item employee={item} setShowDialog={setSelectedEmployee} />
  );

  if (waitingResponse) {
    return (
      <View style={{ margin: 50 }}>
        <ActivityIndicator animating color={Colors.light.red} />
      </View>
    );
  }
  return (
    <StyledNewRequest>
      <PaddingView>
        <PageHeader pageName="Nova Solicitação" navigation={navigation} />

        <StyledNewRequestForm>
          <Text style={{ marginBottom: 20 }}>
            Escolha uma data e um período e clique em Procurar para ver os
            funcionários disponíveis para troca.
          </Text>
          {Platform.OS === "web" ? (
            <WebPicker
              currentValue={moment(timestamp).format("YYYY-MM-DD")}
              onChange={(value: string) => {
                setTimestamp(new Date(value).getTime());
              }}
              style={{
                fontSize: "16px",
                height: "25px",
                borderColor: Colors.light["dark-gray"],
                border: "1px solid",
                borderRadius: "50px",
                paddingTop: 10,
                paddingBottom: 10,
                paddingRight: 40,
                paddingLeft: 40,
              }}
            />
          ) : (
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <StyledDatesContainer onPress={() => setOpenStart(true)}>
                <StyledDatesTitle>Start:</StyledDatesTitle>
                <StyledDates>
                  {moment(timestamp).format("DD-MM-YY HH:mm")}
                </StyledDates>
              </StyledDatesContainer>
              <DateTimePickerModal
                date={new Date(timestamp)}
                isVisible={openStart}
                mode="datetime"
                onConfirm={(date) => {
                  setOpenStart(false);
                  setTimestamp(date.getTime());
                }}
                onCancel={() => setOpenStart(false)}
                style={{ width: "100%", flexGrow: 1 }}
              />
            </View>
          )}
          <StyledRadios>
            <StyledRadioContainer>
              <RadioButton.Android
                value="MANHA"
                status={selectedShift === "MANHA" ? "checked" : "unchecked"}
                onPress={() => setSelectedShift("MANHA")}
                color={Colors.light.red}
              />
              <StyledRadioLabel>Manhã</StyledRadioLabel>
            </StyledRadioContainer>
            <StyledRadioContainer style={{ marginRight: 40, marginLeft: 40 }}>
              <RadioButton.Android
                value="TARDE"
                status={selectedShift === "TARDE" ? "checked" : "unchecked"}
                onPress={() => setSelectedShift("TARDE")}
                color={Colors.light.red}
              />
              <StyledRadioLabel>Tarde</StyledRadioLabel>
            </StyledRadioContainer>
            <StyledRadioContainer>
              <RadioButton.Android
                value="NOITE"
                status={selectedShift === "NOITE" ? "checked" : "unchecked"}
                onPress={() => setSelectedShift("NOITE")}
                color={Colors.light.red}
              />
              <StyledRadioLabel>Noite</StyledRadioLabel>
            </StyledRadioContainer>
          </StyledRadios>
          <SubmitPressable
            style={{ marginTop: 20, marginBottom: 20 }}
            onPress={handleNewRequest}
          >
            <SubmitPressableText>Procurar</SubmitPressableText>
            <IconContainer>
              <MaterialCommunityIcons
                name="calendar-sync-outline"
                size={20}
                color={Colors.light.white}
              />
            </IconContainer>
          </SubmitPressable>
        </StyledNewRequestForm>
        {loading ? (
          <ActivityIndicator animating color={Colors.light.red} />
        ) : null}
        <FlatList
          data={employees}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.id}`}
          style={{ width: Platform.OS === "web" ? 400 : "100%", height: "50%" }}
        />
      </PaddingView>
      {selectedEmployee ? (
        <ConfirmationDialog
          onCancel={() => setSelectedEmployee(undefined)}
          onDelete={() => handleNewRequest()}
          text={`request change with ${selectedEmployee.nomeCompleto}`}
          type="submit"
        />
      ) : null}
    </StyledNewRequest>
  );
}

function Item({
  employee,
  setShowDialog,
}: {
  employee: Employee;
  setShowDialog: Dispatch<SetStateAction<Employee | undefined>>;
}) {
  return (
    <Card style={shadowStyles}>
      <Card.Content>
        <ItemContainer
          style={Platform.OS !== "web" ? { flexDirection: "column" } : null}
        >
          <ItemText>{employee.nomeCompleto}</ItemText>
          <ItemText style={{ margin: 20 }}>{employee.turnoPrincipal}</ItemText>
          <ItemAccept>
            <PressableText onPress={() => setShowDialog(employee)}>
              solicitar
            </PressableText>
          </ItemAccept>
        </ItemContainer>
      </Card.Content>
    </Card>
  );
}

export default NewRequest;

const StyledNewRequest = styled.View`
  display: flex;
  flex-direction: column;
  position: relative;
  flex: 1;
  background-color: white;
  width: 100%;
  height: 100%;
`;

const StyledNewRequestForm = styled.View`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;
const StyledRadios = styled.View`
  display: flex;
  flex-direction: row;
  margin-bottom: 20px;
`;
const StyledRadioContainer = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
`;
const StyledRadioLabel = styled.Text`
  color: ${Colors.light.black};
`;

const StyledDatesContainer = styled.Pressable`
  display: flex;
  margin-bottom: 30px;
  margin-top: 30px;
  font-size: 18px;
  border: 1px solid ${Colors.light["dark-gray"]};
  border-radius: 5px;
  padding: 10px;
  width: 100%;
`;
const StyledDatesTitle = styled.Text`
  color: ${Colors.light.black};
  margin-right: 5px;
  font-weight: 600;
`;
const StyledDates = styled.Text`
  color: ${Colors.light["dark-gray"]};
  font-size: 16px;
  border: none;
`;

const ItemContainer = styled.View`
  margin: auto;
  display: flex;
  border-radius: 3px;
  align-items: center;
  width: 100%;
`;

const ItemText = styled.Text`
  text-transform: capitalize;
`;

const ItemAccept = styled.Pressable`
  background-color: ${Colors.light["dark-blue"]};
  padding: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 20px;
  width: 100%;
  margin-top: 20px;
  align-self: stretch;
`;

const PressableText = styled(SubmitPressableText)`
  color: white;
  margin: 0;
`;
