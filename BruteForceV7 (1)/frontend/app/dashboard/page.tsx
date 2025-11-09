"use client";

import { Button, Combobox, createListCollection, Flex, Heading, Icon, Input, Portal, Text } from "@chakra-ui/react";
import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LuArrowRight, LuArrowUp } from "react-icons/lu";

export default function Dashboard() {
    const [transactions, setTransactions] = useState([]);
    const [all_users, setAllUser] = useState(createListCollection({items:[]}));
    const [user, setUser] = useState(0);
    const [amount, setAmount] = useState(0);

    useEffect(() => {
        const token_raw = getCookie("token");
        const token = token_raw ? token_raw : "";
        fetch("http://localhost:42069/transactions", {
            method: "GET",
            headers: {
                "x-token": token + ""
            }
        }).then(resp => {
            if (resp.status == 200) {
                resp.json().then(js => {
                    setTransactions(js);
                });
            }
        });

        fetch("http://localhost:42069/user_aliases").then(resp => {
            resp.json().then(js => {
                const coll = createListCollection(
                    {
                        items: js.map(e => {
                            return { label: e.username, value: e.id+"" }
                        })
                    }
                );
                setAllUser(coll);
            });
        });
    }, []);

    const router = useRouter();

    return (
        <Flex flexDirection={"column"} flex={1} gap={"50px"}>
            <Flex flexDirection={"row"} flex={1} verticalAlign={"middle"}>
                <Input value={amount} onChange={(e)=>{setAmount(e.target.valueAsNumber)}} type="number"></Input>
                <Icon size="lg">
                    <LuArrowRight/>
                </Icon>
                <Combobox.Root
                    collection={all_users}
                    onInputValueChange={(e) => {
                        console.log(e.inputValue)
                        const keys = all_users.items.filter(q=>{return q.label == e.inputValue});
                        if(keys.length > 0)
                        {
                            setUser(keys[0].value);
                        }else{
                            setUser(-1);
                        }
                    }}
                    width="320px"
                >
                    <Combobox.Control>
                        <Combobox.Input placeholder="Type to search" />
                        <Combobox.IndicatorGroup>
                            <Combobox.ClearTrigger />
                            <Combobox.Trigger />
                        </Combobox.IndicatorGroup>
                    </Combobox.Control>
                    <Portal>
                        <Combobox.Positioner>
                            <Combobox.Content>
                                <Combobox.Empty>No items found</Combobox.Empty>
                                {all_users.items.map((item) => (
                                    <Combobox.Item item={item} key={item.value}>
                                        {item.label}
                                        <Combobox.ItemIndicator />
                                    </Combobox.Item>
                                ))}
                            </Combobox.Content>
                        </Combobox.Positioner>
                    </Portal>
                </Combobox.Root>
                <Button onClick={()=>{
                    const token_raw = getCookie("token");
                    const token = token_raw ? token_raw : "";
                    fetch("http://localhost:42069/send_money",{
                        method:"POST",
                        headers:{
                            "x-token": token+"",
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            to: user,
                            amount: amount
                        })
                    }).then(()=>{
                        router.refresh();
                    });
                }}>
                    Send <LuArrowUp/>
                </Button>
            </Flex>
            <Flex flexDirection={"column"}>
                {
                    transactions.map((e,i,a) => {
                        const col = (i%2 == 0) ? "lightgray" : "white"; 
                        return (
                            <Flex backgroundColor={col} flexDirection={"column"} key={i}>
                                <Flex flexDirection={"row"}>
                                    <Text>{e["u_from"]}</Text>
                                    <Icon size={"lg"}>
                                        <LuArrowRight />
                                    </Icon>
                                    
                                    <Text>{e["u_to"]}</Text>
                                </Flex>
                                <Heading>{e["amount"]}</Heading>
                            </Flex>
                        )
                    })
                }
            </Flex>
        </Flex>
    );
}
